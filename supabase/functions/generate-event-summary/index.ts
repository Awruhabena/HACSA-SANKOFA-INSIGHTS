import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSTRUCTION = `You are a careful data analyst for a nonprofit heritage foundation. You will be given exact statistics and exact attendee feedback comments. Your job is to summarise and recommend based STRICTLY on the data provided.

Hard rules, no exceptions:
1. Never invent a statistic, percentage, or number that is not explicitly present in the data given to you.
2. Never invent or paraphrase an attendee quote that was not among the comments given to you.
3. If the data is thin or ambiguous on a point, say so plainly rather than filling the gap with a plausible-sounding guess.
4. Every recommendation must trace back to something specific in the data (a rating gap, a repeated comment theme, a stat) — not generic event-planning advice unrelated to what was actually reported.
5. Output ONLY the JSON object requested. No markdown, no preamble, no closing remarks.`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(prompt: string, geminiKey: string, maxAttempts = 4) {
  const models = ["gemini-flash-latest", "gemini-flash-lite-latest"];
  let lastErrorText = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = models[attempt % models.length];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.15,
            topP: 0.8,
          },
        }),
      }
    );

    if (res.ok) {
      return res;
    }

    lastErrorText = await res.text();
    const retryable = res.status === 503 || res.status === 429 || res.status >= 500;
    if (!retryable || attempt === maxAttempts - 1) {
      throw new Error(lastErrorText);
    }

    const backoffMs = 500 * Math.pow(2, attempt);
    await sleep(backoffMs);
  }

  throw new Error(lastErrorText);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY secret is not set on this project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: stats }, { data: geography }, { data: composition }, { data: feedback }, { data: event }] =
      await Promise.all([
        supabase.rpc("dashboard_stats", { p_event_id: event_id }),
        supabase.rpc("dashboard_geography", { p_event_id: event_id }),
        supabase.rpc("dashboard_composition", { p_event_id: event_id }),
        supabase.rpc("dashboard_feedback", { p_event_id: event_id }),
        supabase.from("events").select("title").eq("id", event_id).single(),
      ]);

    const commentCount = (feedback?.comments || []).length;

    if (commentCount === 0) {
      return new Response(
        JSON.stringify({ error: "No written feedback comments exist yet for this event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const commentsText = (feedback.comments as any[])
      .map(
        (c, i) =>
          `${i + 1}. [${c.region_type ?? "unlinked"}, ${c.rating}/5] ${
            c.what_stood_out ? `Stood out: "${c.what_stood_out}"` : ""
          } ${c.what_to_improve ? `Improve: "${c.what_to_improve}"` : ""}`
      )
      .join("\n");

    const prompt = `Event: "${event?.title ?? "this event"}"

HEADLINE STATS
Total registrations: ${stats?.total_registrations}
Feedback responses: ${stats?.feedback_responses}
Average rating: ${stats?.average_rating}/5

GEOGRAPHY (share of attendees)
${(geography?.regions || []).map((r: any) => `${r.region_type}: ${r.percentage}% (${r.count} people)`).join("\n")}

SATISFACTION BY REGION
${(feedback?.rating_by_region || []).map((r: any) => `${r.region_type}: ${r.avg_rating}/5 average (${r.count} responses)`).join("\n")}

AUDIENCE COMPOSITION
Top industries: ${(composition?.industries || []).slice(0, 5).map((i: any) => `${i.label} (${i.count})`).join(", ")}
Occupation mix: ${(composition?.occupations || []).map((o: any) => `${o.label} (${o.count})`).join(", ")}

WRITTEN FEEDBACK (${commentCount} responses — this is the COMPLETE set, there are no others)
${commentsText}

Respond with ONLY this JSON shape:
{
  "summary_text": "2-3 sentence plain-language summary of how the event landed overall",
  "key_themes": ["short theme", "short theme", "short theme"],
  "recommendations": ["one concrete, specific recommendation grounded in the data above", "another", "another"]
}`;

    let aiResponse;
    try {
      aiResponse = await callGeminiWithRetry(prompt, geminiKey);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "AI provider error after retries", detail: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawText = aiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: rawText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("ai_summaries").delete().eq("event_id", event_id);
    const { error: insertError } = await supabase.from("ai_summaries").insert({
      event_id,
      summary_text: parsed.summary_text,
      key_themes: parsed.key_themes || [],
      recommendations: parsed.recommendations || [],
      comment_count: commentCount,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to store summary", detail: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ status: "generated", ...parsed, comment_count: commentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
