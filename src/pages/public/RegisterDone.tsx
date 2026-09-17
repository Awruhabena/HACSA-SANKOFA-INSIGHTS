import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/types';
import { Spinner, Card } from '../../components/ui';
import { CheckCircle2, Info, Bell } from 'lucide-react';

export default function RegisterDone() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const location = useLocation();
  const state = location.state as { status?: string; eventTitle?: string } | null;

  const [eventTitle, setEventTitle] = useState(state?.eventTitle || '');
  const [loading, setLoading] = useState(!state?.eventTitle);

  useEffect(() => {
    if (state?.eventTitle) return;
    async function fetchEvent() {
      try {
        const { data } = await supabase
          .from('events')
          .select('title')
          .eq('slug', eventSlug!)
          .eq('is_published', true)
          .single();
        if (data) setEventTitle((data as Event).title);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventSlug, state?.eventTitle]);

  if (!state?.status) {
    return <Navigate to={`/register/${eventSlug}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8 text-teal" />
      </div>
    );
  }

  const isAlreadyRegistered = state.status === 'already_registered';

  return (
    <Card className="text-center py-12 px-6 sm:px-10 shadow-sm space-y-6">
      {isAlreadyRegistered ? (
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center border border-gold/30 text-amber-700">
          <Info className="w-8 h-8" />
        </div>
      ) : (
        <div className="mx-auto w-16 h-16 rounded-2xl bg-teal/15 flex items-center justify-center border border-teal/30 text-teal">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
          {isAlreadyRegistered ? "You're Already Checked In" : "Registration Confirmed!"}
        </h1>
        <p className="font-aside text-teal text-xl font-bold mt-1">
          ~ welcome to the gathering
        </p>
      </div>

      <p className="text-gray text-base max-w-md mx-auto leading-relaxed">
        {isAlreadyRegistered
          ? 'We have your check-in information on file for this programme. Have a wonderful and enriching experience!'
          : `Welcome to ${eventTitle || 'the event'}. Please make yourself comfortable and enjoy the programme.`}
      </p>

      <div className="p-4 rounded-2xl bg-cream border border-border/80 text-xs text-navy font-medium max-w-md mx-auto flex items-center gap-2.5 text-left">
        <Bell className="w-4 h-4 text-teal shrink-0" />
        <span><strong className="font-heading">Friendly Reminder:</strong> Before leaving, scan the feedback QR code near the exit to share your thoughts!</span>
      </div>
    </Card>
  );
}
