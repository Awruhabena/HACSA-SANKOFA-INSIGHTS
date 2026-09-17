import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/types';
import { Spinner, StatCard, Card, Button } from '../../components/ui';
import { MapPin, Calendar, Download, QrCode, Users, MessageSquareHeart, ExternalLink, Sparkles, Brain, Lightbulb, RefreshCw } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [regCount, setRegCount] = useState(0);
  const [fbCount, setFbCount] = useState(0);

  const [aiSummary, setAiSummary] = useState<{
    summary_text: string;
    key_themes: string[];
    recommendations: string[];
    generated_at: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const regQrRef = useRef<HTMLDivElement>(null);
  const fbQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id!)
          .single();

        if (error || !data) return;
        setEvent(data as Event);

        const [regResult, fbResult] = await Promise.all([
          supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id!),
          supabase
            .from('feedback')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id!),
        ]);
        setRegCount(regResult.count || 0);
        setFbCount(fbResult.count || 0);
        const { data: existingSummary } = await supabase
          .from('ai_summaries')
          .select('summary_text, key_themes, recommendations, generated_at')
          .eq('event_id', id!)
          .maybeSingle();
        if (existingSummary) setAiSummary(existingSummary as typeof aiSummary);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const downloadQr = useCallback(
    (containerRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
      const container = containerRef.current;
      if (!container) return;
      const canvas = container.querySelector('canvas');
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    []
  );

  const handleGenerateSummary = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-summary', {
        body: { event_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSummary({
        summary_text: data.summary_text,
        key_themes: data.key_themes,
        recommendations: data.recommendations,
        generated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setAiError(err?.message || 'Could not generate the summary. Try again.');
    } finally {
      setAiLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8 text-teal" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="font-heading text-2xl font-bold text-navy mb-2">
          Event not found
        </h1>
      </div>
    );
  }

  const origin = window.location.origin;
  const registerUrl = `${origin}/register/${event.slug}`;
  const feedbackUrl = `${origin}/feedback/${event.slug}`;

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Event Header Banner */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal/10 text-teal">
                <Sparkles className="w-3 h-3" />
                Active Programme
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray mt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-clay" />
                {event.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal" />
                {formattedDate}
              </span>
            </div>
            {event.description && (
              <p className="text-xs text-ink/80 mt-3 max-w-2xl leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Stat Counters */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Registrations"
          value={regCount}
          subtext="Scanned entrance QR badge"
          badge="Live Attendance"
          badgeColor="teal"
          accentColor="#3C8C89"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Feedback Responses"
          value={fbCount}
          subtext="Scanned exit feedback QR"
          badge="Live Feedback"
          badgeColor="gold"
          accentColor="#C8963E"
          icon={<MessageSquareHeart className="w-5 h-5" />}
        />
      </div>

      {/* QR Code Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration QR */}
        <Card className="p-6 sm:p-8 text-center flex flex-col justify-between rounded-3xl shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/10 text-navy mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Entrance Placement</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-navy mb-1">
              Attendee Registration QR
            </h2>
            <p className="text-xs text-gray mb-6">Print on entrance posters and reception check-in desks</p>

            <div
              ref={regQrRef}
              className="inline-flex justify-center p-4 bg-cream/70 rounded-3xl border border-border/80 mb-4 shadow-2xs"
            >
              <QRCodeCanvas
                value={registerUrl}
                size={220}
                fgColor="#1D3A58"
                bgColor="transparent"
                includeMargin
              />
            </div>

            <a
              href={registerUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-2xl bg-cream border border-border/60 text-xs text-navy font-mono break-all select-all mb-5 flex items-center justify-center gap-1.5 hover:bg-cream/80 transition-colors"
            >
              <span className="truncate">{registerUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-teal" />
            </a>
          </div>

          <Button
            variant="navy"
            onClick={() => downloadQr(regQrRef, `hacsa-${event.slug}-registration.png`)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable PNG (256x256)</span>
          </Button>
        </Card>

        {/* Feedback QR */}
        <Card className="p-6 sm:p-8 text-center flex flex-col justify-between rounded-3xl shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal/10 text-teal mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Exit Placement</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-navy mb-1">
              Attendee Feedback QR
            </h2>
            <p className="text-xs text-gray mb-6">Display near exits, on tables, and on closing event slides</p>

            <div
              ref={fbQrRef}
              className="inline-flex justify-center p-4 bg-cream/70 rounded-3xl border border-border/80 mb-4 shadow-2xs"
            >
              <QRCodeCanvas
                value={feedbackUrl}
                size={220}
                fgColor="#3C8C89"
                bgColor="transparent"
                includeMargin
              />
            </div>

            <a
              href={feedbackUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-2xl bg-cream border border-border/60 text-xs text-navy font-mono break-all select-all mb-5 flex items-center justify-center gap-1.5 hover:bg-cream/80 transition-colors"
            >
              <span className="truncate">{feedbackUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-teal" />
            </a>
          </div>

          <Button
            variant="primary"
            onClick={() => downloadQr(fbQrRef, `hacsa-${event.slug}-feedback.png`)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable PNG (256x256)</span>
          </Button>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card className="p-6 sm:p-8 rounded-3xl shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal" />
            <h2 className="font-heading text-xl font-bold text-navy">AI Insights</h2>
          </div>
          <Button
            variant="navy"
            onClick={handleGenerateSummary}
            disabled={aiLoading}
            className="flex items-center gap-2 !w-auto px-4"
          >
            <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'Generating…' : aiSummary ? 'Regenerate' : 'Generate Summary'}</span>
          </Button>
        </div>
        <p className="text-[10px] text-gray -mt-3 mb-4 italic">
          AI-generated from real event data — verify against the stats above before presenting.
        </p>

        {aiError && (
          <p className="text-xs text-clay bg-clay/5 border border-clay/20 rounded-2xl p-3 mb-4">
            {aiError}
          </p>
        )}

        {!aiSummary && !aiLoading && !aiError && (
          <p className="text-xs text-gray py-6 text-center">
            No AI summary generated yet for this event.
          </p>
        )}

        {aiSummary && (
          <div className="space-y-5">
            <p className="text-sm text-ink leading-relaxed">{aiSummary.summary_text}</p>

            <div>
              <p className="text-[10px] font-bold text-gray uppercase tracking-wider mb-2">Key Themes</p>
              <div className="flex flex-wrap gap-2">
                {aiSummary.key_themes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-teal/10 text-teal"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray uppercase tracking-wider mb-2">Recommendations</p>
              <div className="space-y-2">
                {aiSummary.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-2xl bg-cream/50 border border-border/50">
                    <Lightbulb className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <p className="text-xs text-ink leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-gray">
              Last generated {new Date(aiSummary.generated_at).toLocaleString()}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
