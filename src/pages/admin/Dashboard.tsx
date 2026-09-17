import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/types';
import {
  REGION_TYPE_LABELS,
  REGION_TYPE_COLOURS,
  type RegionType,
} from '../../lib/constants';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight,
  Star,
  Users,
  UserCheck,
  MessageSquareHeart,
  Award,
  Globe2,
  Briefcase,
  GraduationCap,
  MessageSquareQuote,
  Radio,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  total_registrations: number;
  unique_people: number;
  feedback_responses: number;
  response_rate: number;
  average_rating: number;
}

interface GeographyRegion {
  region_type: RegionType;
  count: number;
  percentage: number;
}

interface GeographyCountry {
  country: string;
  count: number;
}

interface CompositionItem {
  label: string;
  count: number;
}

interface FeedbackComment {
  region_type: RegionType | null;
  rating: number;
  what_stood_out: string | null;
  what_to_improve: string | null;
}

interface RatingByRegion {
  region_type: RegionType;
  avg_rating: number;
  count: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
}

interface DashboardFeedback {
  average_rating: number;
  rating_distribution: RatingDistribution[];
  rating_by_region: RatingByRegion[];
  comments: FeedbackComment[];
  matched_count: number;
  total_count: number;
  unmatched_count: number;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={
            star <= Math.round(rating)
              ? 'fill-gold text-gold'
              : 'fill-transparent text-locked-outline'
          }
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-border bg-white p-3.5 shadow-md">
        <p className="text-xs font-semibold text-gray mb-1">{label}</p>
        <p className="text-sm font-bold text-navy font-heading">
          {payload[0].name || 'Count'}: <span className="text-teal">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [geography, setGeography] = useState<{
    regions: GeographyRegion[];
    countries: GeographyCountry[];
  } | null>(null);
  const [composition, setComposition] = useState<{
    industries: CompositionItem[];
    occupations: CompositionItem[];
  } | null>(null);
  const [feedback, setFeedback] = useState<DashboardFeedback | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(true);
  const [, setFbLoading] = useState(true);

  const [flashCards, setFlashCards] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Incremented on every fetch cycle so a slow, superseded response
  // can be discarded instead of overwriting fresher data.
  const requestIdRef = useRef(0);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data as Event[]);
      });
  }, []);

  const fetchStats = useCallback(async (requestId: number) => {
    setStatsLoading(true);
    try {
      const { data } = await supabase.rpc('dashboard_stats', {
        p_event_id: selectedEventId,
      });
      if (requestId !== requestIdRef.current) return;
      if (data) setStats(data as DashboardStats);
    } catch {
      // ignore
    } finally {
      if (requestId === requestIdRef.current) setStatsLoading(false);
    }
  }, [selectedEventId]);

  const fetchGeography = useCallback(async (requestId: number) => {
    setGeoLoading(true);
    try {
      const { data } = await supabase.rpc('dashboard_geography', {
        p_event_id: selectedEventId,
      });
      if (requestId !== requestIdRef.current) return;
      if (data) {
        const d = data as any;
        setGeography({
          regions: d.regions || [],
          countries: d.countries || [],
        });
      }
    } catch {
      // ignore
    } finally {
      if (requestId === requestIdRef.current) setGeoLoading(false);
    }
  }, [selectedEventId]);

  const fetchComposition = useCallback(async (requestId: number) => {
    setCompLoading(true);
    try {
      const { data } = await supabase.rpc('dashboard_composition', {
        p_event_id: selectedEventId,
      });
      if (requestId !== requestIdRef.current) return;
      if (data) {
        const d = data as any;
        setComposition({
          industries: d.industries || [],
          occupations: d.occupations || [],
        });
      }
    } catch {
      // ignore
    } finally {
      if (requestId === requestIdRef.current) setCompLoading(false);
    }
  }, [selectedEventId]);

  const fetchFeedback = useCallback(async (requestId: number) => {
    setFbLoading(true);
    try {
      const { data } = await supabase.rpc('dashboard_feedback', {
        p_event_id: selectedEventId,
      });
      if (requestId !== requestIdRef.current) return;
      if (data) setFeedback(data as DashboardFeedback);
    } catch {
      // ignore
    } finally {
      if (requestId === requestIdRef.current) setFbLoading(false);
    }
  }, [selectedEventId]);

  const fetchAll = useCallback(() => {
    const requestId = ++requestIdRef.current;
    fetchStats(requestId);
    fetchGeography(requestId);
    fetchComposition(requestId);
    fetchFeedback(requestId);
  }, [fetchStats, fetchGeography, fetchComposition, fetchFeedback]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const triggerFlash = useCallback(() => {
    setFlashCards(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashCards(false), 600);
  }, []);

  const fetchAllRef = useRef(fetchAll);
  useEffect(() => {
    fetchAllRef.current = fetchAll;
  }, [fetchAll]);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'people' }, () => {
        fetchAllRef.current();
        triggerFlash();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, () => {
        fetchAllRef.current();
        triggerFlash();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
        fetchAllRef.current();
        triggerFlash();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          pollInterval = setInterval(() => fetchAllRef.current(), 10000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [triggerFlash]);

  const selectedEventTitle = events.find((e) => e.id === selectedEventId)?.title || 'All Events Overview';

  return (
    <div className="space-y-8 font-body">
      {/* Top Controls & Navigation Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              {selectedEventTitle}
            </h1>
          </div>
          <p className="text-xs text-gray mt-1">
            Realtime diaspora reach, check-in volume, and satisfaction breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Calm, Attractive Live Indicator Pill (No blinking/pinging light) */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-teal shrink-0" />
            <span className="text-[11px] font-bold text-navy tracking-wide font-heading">
              Live Connection
            </span>
          </div>

          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="rounded-2xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy min-h-[42px] transition-all focus:border-teal focus:ring-1 focus:ring-teal shadow-2xs font-heading cursor-pointer"
          >
            <option value="">All Events (Aggregate View)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1 — Bento Hero Banner with Official Identity */}
      <div className="rounded-3xl bg-navy p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-white/90 mb-3 border border-white/10">
              <Sparkles className="w-3 h-3 text-gold" />
              <span>Sankofa Heritage Intelligence</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              Community & Sentiment Hub
            </h2>
            <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
              Tracking attendee demographic flow, local vs diaspora engagement, and qualitative feedback scores.
            </p>
            <p className="font-aside text-gold text-lg mt-2">
              ~ connecting heritage, culture, and community
            </p>
          </div>

          {/* Embedded Bento Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full lg:w-auto">
            {/* Highlight 1: Registrations */}
            <div
              className={`group cursor-pointer rounded-2xl bg-teal p-4 text-white shadow-xs hover:shadow-lg hover:scale-[1.03] transition-all duration-300 ${
                flashCards ? 'ring-4 ring-gold' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/80 font-medium mb-1">
                <span>Registrations</span>
                <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-3xl font-heading font-extrabold tracking-tight">
                {statsLoading ? '—' : stats?.total_registrations || 0}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
                <UserCheck className="w-3 h-3 text-white transition-transform duration-200 group-hover:scale-110" />
                <span>Verified Check-Ins</span>
              </div>
            </div>

            {/* Highlight 2: Response Rate */}
            <div
              className={`group cursor-pointer rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-4 text-white shadow-xs hover:shadow-lg hover:scale-[1.03] hover:bg-white/15 transition-all duration-300 ${
                flashCards ? 'ring-4 ring-gold' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/70 font-medium mb-1">
                <span>Feedback Rate</span>
                <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-3xl font-heading font-extrabold tracking-tight">
                {statsLoading ? '—' : `${stats?.response_rate || 0}%`}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gold font-medium">
                <MessageSquareHeart className="w-3 h-3 text-gold transition-transform duration-200 group-hover:scale-110" />
                <span>{stats?.feedback_responses || 0} survey responses</span>
              </div>
            </div>

            {/* Highlight 3: Overall Satisfaction */}
            <div
              className={`group cursor-pointer rounded-2xl bg-white text-navy p-4 shadow-xs hover:shadow-lg hover:scale-[1.03] transition-all duration-300 ${
                flashCards ? 'ring-4 ring-gold' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-gray font-medium mb-1">
                <span>Satisfaction</span>
                <span className="h-6 w-6 rounded-full bg-cream flex items-center justify-center text-xs text-gold font-bold transition-transform duration-200 group-hover:scale-115">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-heading font-extrabold text-navy tracking-tight">
                  {statsLoading ? '—' : stats?.average_rating ? stats.average_rating.toFixed(1) : '—'}
                </p>
                <span className="text-xs text-gray font-semibold">/ 5.0</span>
              </div>
              <div className="mt-2">
                <StarRating rating={stats?.average_rating || 0} size={13} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Graphic KPI Row with Icons & Subtext */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="group cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray uppercase tracking-wider font-heading">
                Total Check-Ins
              </span>
              <span className="h-7 w-7 rounded-full bg-cream border border-border flex items-center justify-center text-teal transition-transform duration-300 group-hover:scale-115 group-hover:bg-teal/10">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-navy tracking-tight">
              {statsLoading ? '...' : stats?.total_registrations || 0}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal/10 text-teal">
              Entrance Scans
            </span>
            <div className="flex items-end gap-1 h-5 origin-bottom transition-transform duration-300 group-hover:scale-y-125">
              <span className="w-1 bg-teal/20 rounded-full h-2" />
              <span className="w-1 bg-teal/40 rounded-full h-3" />
              <span className="w-1 bg-teal/60 rounded-full h-4" />
              <span className="w-1 bg-teal rounded-full h-5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray uppercase tracking-wider font-heading">
                Unique People
              </span>
              <span className="h-7 w-7 rounded-full bg-cream border border-border flex items-center justify-center text-navy transition-transform duration-300 group-hover:scale-115 group-hover:bg-navy/10">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-navy tracking-tight">
              {statsLoading ? '...' : stats?.unique_people || 0}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy">
              Deduplicated
            </span>
            <div className="flex items-end gap-1 h-5 origin-bottom transition-transform duration-300 group-hover:scale-y-125">
              <span className="w-1 bg-navy/20 rounded-full h-3" />
              <span className="w-1 bg-navy/40 rounded-full h-5" />
              <span className="w-1 bg-navy/60 rounded-full h-3" />
              <span className="w-1 bg-navy rounded-full h-4" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray uppercase tracking-wider font-heading">
                Feedback Responses
              </span>
              <span className="h-7 w-7 rounded-full bg-cream border border-border flex items-center justify-center text-amber-700 transition-transform duration-300 group-hover:scale-115 group-hover:bg-gold/15">
                <MessageSquareHeart className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-navy tracking-tight">
              {statsLoading ? '...' : stats?.feedback_responses || 0}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-amber-700">
              {stats?.response_rate || 0}% Return Rate
            </span>
            <div className="flex items-end gap-1 h-5 origin-bottom transition-transform duration-300 group-hover:scale-y-125">
              <span className="w-1 bg-gold/30 rounded-full h-2" />
              <span className="w-1 bg-gold/60 rounded-full h-3" />
              <span className="w-1 bg-gold rounded-full h-4" />
              <span className="w-1 bg-gold rounded-full h-5" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="group cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray uppercase tracking-wider font-heading">
                Experience Rating
              </span>
              <span className="h-7 w-7 rounded-full bg-cream border border-border flex items-center justify-center text-gold transition-transform duration-300 group-hover:scale-115 group-hover:bg-gold/15">
                <Award className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl font-heading font-extrabold text-navy tracking-tight">
              {statsLoading ? '...' : stats?.average_rating ? stats.average_rating.toFixed(1) : '—'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal/10 text-teal">
              Out of 5.0
            </span>
            <StarRating rating={stats?.average_rating || 0} size={11} />
          </div>
        </div>
      </div>

      {/* SECTION 3 — Geography & Top Countries Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Demographic Split (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-teal" />
                <h3 className="font-heading text-base font-bold text-navy">
                  Origin Breakdown
                </h3>
              </div>
              <span className="font-aside text-teal font-bold text-base">
                ~ Diaspora vs Local
              </span>
            </div>
            <p className="text-xs text-gray mb-4">
              Demographic classification of all registered participants
            </p>
          </div>

          {geoLoading ? (
            <div className="h-56 flex items-center justify-center">
              <span className="text-xs text-gray">Loading geographic distribution...</span>
            </div>
          ) : geography && geography.regions.length > 0 ? (
            <div>
              <div className="relative">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={geography.regions.map((r) => ({
                        name: REGION_TYPE_LABELS[r.region_type] || r.region_type,
                        value: r.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {geography.regions.map((r) => (
                        <Cell
                          key={r.region_type}
                          fill={REGION_TYPE_COLOURS[r.region_type] || '#3C8C89'}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-gray tracking-wider">
                    Total
                  </span>
                  <span className="text-xl font-heading font-extrabold text-navy">
                    {stats?.total_registrations || 0}
                  </span>
                </div>
              </div>

              {/* Bento Pill Legend */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/60 text-center">
                {geography.regions.map((r) => (
                  <div key={r.region_type} className="p-2.5 rounded-2xl bg-cream/70 border border-border/40">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mb-1"
                      style={{ backgroundColor: REGION_TYPE_COLOURS[r.region_type] }}
                    />
                    <p className="text-[11px] font-bold text-navy truncate font-heading">
                      {REGION_TYPE_LABELS[r.region_type]}
                    </p>
                    <p className="text-sm font-extrabold font-heading text-navy mt-0.5">
                      {r.percentage}%
                    </p>
                    <p className="text-[10px] text-gray">{r.count} guests</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray text-xs">
              No regional check-ins recorded yet
            </div>
          )}
        </div>

        {/* Top Countries Stadium Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-navy" />
                <h3 className="font-heading text-base font-bold text-navy">
                  Top Participant Countries
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal/10 text-teal">
                Global Attendees
              </span>
            </div>
            <p className="text-xs text-gray mb-4">
              Geographic reach across the African continent and diaspora nations
            </p>
          </div>

          {geoLoading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="text-xs text-gray">Loading countries...</span>
            </div>
          ) : geography && geography.countries.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={geography.countries.slice(0, 8)}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={140}
                  tick={{ fontSize: 12, fill: '#21304A', fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Attendees"
                  fill="#3C8C89"
                  radius={[0, 10, 10, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray text-xs">
              No country data logged yet
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 — Audience Composition (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-navy" />
              <h3 className="font-heading text-base font-bold text-navy">
                Industry & Creative Sectors
              </h3>
            </div>
            <span className="text-xs font-bold text-gray">Profile</span>
          </div>
          <p className="text-xs text-gray mb-4">Attendee professional ecosystem</p>

          {compLoading ? (
            <div className="h-56 flex items-center justify-center text-xs text-gray">Loading...</div>
          ) : composition && composition.industries.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(220, composition.industries.length * 32)}>
              <BarChart
                layout="vertical"
                data={[...composition.industries].sort((a, b) => b.count - a.count)}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={150}
                  tick={{ fontSize: 11, fill: '#21304A', fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Attendees" fill="#1D3A58" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-xs text-gray">No sector data</div>
          )}
        </div>

        {/* Occupation */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal" />
              <h3 className="font-heading text-base font-bold text-navy">
                Occupation Profile
              </h3>
            </div>
            <span className="text-xs font-bold text-gray">Status</span>
          </div>
          <p className="text-xs text-gray mb-4">Career lifecycle breakdown</p>

          {compLoading ? (
            <div className="h-56 flex items-center justify-center text-xs text-gray">Loading...</div>
          ) : composition && composition.occupations.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(220, composition.occupations.length * 32)}>
              <BarChart
                layout="vertical"
                data={[...composition.occupations].sort((a, b) => b.count - a.count)}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fontSize: 11, fill: '#21304A', fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Attendees" fill="#3C8C89" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-xs text-gray">No occupation data</div>
          )}
        </div>
      </div>

      {/* SECTION 5 — Feedback & Regional Satisfaction (The Key Insight) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating Distribution (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading text-base font-bold text-navy">
                Rating Distribution
              </h3>
              <div className="flex items-center gap-1.5">
                <StarRating rating={feedback?.average_rating || 0} size={15} />
                <span className="font-heading font-extrabold text-navy text-sm">
                  {feedback?.average_rating ? feedback.average_rating.toFixed(1) : '—'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray mb-4">Frequency of 1 to 5 star ratings</p>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={feedback?.rating_distribution || []}>
              <XAxis
                dataKey="rating"
                tickFormatter={(v) => `★ ${v}`}
                tick={{ fontSize: 12, fill: '#21304A', fontWeight: 700 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Votes"
                fill="#C8963E"
                radius={[8, 8, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PROMINENT REGIONAL COMPARISON (7 cols) - KEY STRATEGIC MOMENT */}
        <div className="lg:col-span-7 rounded-3xl border-2 border-teal/40 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 px-3.5 py-1 bg-teal text-white text-[10px] font-extrabold uppercase tracking-widest rounded-bl-2xl font-heading">
            Key Strategic Insight
          </div>
          <div>
            <div className="mb-1">
              <h3 className="font-heading text-base font-bold text-navy">
                Satisfaction by Heritage Category
              </h3>
            </div>
            <p className="text-xs text-gray mb-6">
              Comparing experience quality across Local (Ghana), Continental Africa, and Diaspora
            </p>
          </div>

          {feedback?.rating_by_region && feedback.rating_by_region.length > 0 ? (
            <div className="space-y-4">
              {feedback.rating_by_region.map((r) => {
                const pct = Math.min(100, Math.round((r.avg_rating / 5) * 100));
                const color = REGION_TYPE_COLOURS[r.region_type] || '#3C8C89';

                return (
                  <div key={r.region_type} className="p-3.5 rounded-2xl bg-cream/50 border border-border/50">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-navy flex items-center gap-2 font-heading">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {REGION_TYPE_LABELS[r.region_type] || r.region_type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-extrabold text-navy text-sm">
                          {r.avg_rating.toFixed(1)} / 5.0
                        </span>
                        <span className="text-[11px] text-gray">
                          ({r.count} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-white rounded-full h-3 p-0.5 border border-border/60">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray text-xs">
              No regional feedback entries linked yet
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6 — Qualitative Testimonials Feed */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-teal" />
            <div>
              <h3 className="font-heading text-base font-bold text-navy">
                Attendee Voices & Qualitative Feedback
              </h3>
              <p className="text-xs text-gray">
                Direct attendee reflections (strictly anonymised)
              </p>
            </div>
          </div>
          <span className="font-aside text-teal font-bold text-lg hidden sm:inline-block">
            ~ real perspectives, unfiltered
          </span>
        </div>

        {feedback?.comments && feedback.comments.length > 0 ? (
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-2">
            {feedback.comments.map((comment, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-cream/30 p-4 transition-all hover:bg-cream/60"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    {comment.region_type && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs"
                        style={{
                          backgroundColor:
                            REGION_TYPE_COLOURS[comment.region_type] || '#1D3A58',
                        }}
                      >
                        {REGION_TYPE_LABELS[comment.region_type]}
                      </span>
                    )}
                    <StarRating rating={comment.rating} size={13} />
                  </div>
                  <span className="text-xs font-bold text-navy font-heading">
                    {comment.rating}.0 ★
                  </span>
                </div>

                {comment.what_stood_out && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-gray uppercase tracking-wider mb-0.5">
                      What stood out
                    </p>
                    <p className="text-sm text-ink font-medium leading-relaxed">
                      "{comment.what_stood_out}"
                    </p>
                  </div>
                )}

                {comment.what_to_improve && (
                  <div>
                    <p className="text-[10px] font-bold text-gray uppercase tracking-wider mb-0.5">
                      Areas to improve
                    </p>
                    <p className="text-xs text-ink/80 leading-relaxed">
                      "{comment.what_to_improve}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray py-8 text-center">
            No qualitative feedback has been recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
