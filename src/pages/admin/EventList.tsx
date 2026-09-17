import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/types';
import { Spinner, Button } from '../../components/ui';
import { Calendar, MapPin, Users, MessageSquare, Plus, ArrowUpRight, QrCode } from 'lucide-react';

interface EventWithCounts extends Event {
  registration_count: number;
  feedback_count: number;
}

export default function EventList() {
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (error) throw error;

        const events = (eventsData || []) as Event[];

        // Two bulk queries instead of 2 queries per event (N+1).
        const [{ data: regRows }, { data: fbRows }] = await Promise.all([
          supabase.from('registrations').select('event_id'),
          supabase.from('feedback').select('event_id'),
        ]);

        const countBy = (rows: { event_id: string }[] | null) => {
          const map: Record<string, number> = {};
          for (const row of rows || []) {
            map[row.event_id] = (map[row.event_id] || 0) + 1;
          }
          return map;
        };

        const regCounts = countBy(regRows as { event_id: string }[] | null);
        const fbCounts = countBy(fbRows as { event_id: string }[] | null);

        const eventsWithCounts: EventWithCounts[] = events.map((event) => ({
          ...event,
          registration_count: regCounts[event.id] || 0,
          feedback_count: fbCounts[event.id] || 0,
        }));

        setEvents(eventsWithCounts);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8 text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
            Events Management
          </h1>
          <p className="text-xs text-gray mt-0.5">
            Monitor attendance and manage entrance & exit QR codes
          </p>
        </div>
        <Link to="/admin/events/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-border bg-white p-12 text-center shadow-xs">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-cream border border-border flex items-center justify-center text-teal">
            <QrCode className="w-8 h-8" />
          </div>
          <p className="text-navy font-heading font-bold text-lg mb-1">No events scheduled yet</p>
          <p className="text-gray text-xs mb-5 max-w-sm mx-auto">
            Create your first event to automatically generate entrance registration and exit feedback QR codes.
          </p>
          <Link to="/admin/events/new">
            <Button variant="primary">Create First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-white overflow-hidden shadow-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/40 text-left">
                <th className="px-5 py-3.5 text-xs font-bold text-gray uppercase tracking-wider font-heading">Event Details</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray uppercase tracking-wider font-heading">Date</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray uppercase tracking-wider font-heading">Location</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray uppercase tracking-wider text-right font-heading">Registrations</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray uppercase tracking-wider text-right font-heading">Feedback</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-navy font-heading">{event.title}</p>
                    <span className="text-[11px] text-gray font-mono">slug: {event.slug}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal" />
                      <span>
                        {new Date(event.event_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-clay" />
                      <span>{event.location}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-teal text-right font-heading">
                    <div className="flex items-center justify-end gap-1.5">
                      <Users className="w-3.5 h-3.5 opacity-70" />
                      <span>{event.registration_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-amber-700 text-right font-heading">
                    <div className="flex items-center justify-end gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 opacity-70" />
                      <span>{event.feedback_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-teal bg-teal/10 hover:bg-teal/20 transition-colors font-heading"
                    >
                      <span>View QRs</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
