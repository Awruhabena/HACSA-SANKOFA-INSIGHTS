import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { validateEmail } from '../../lib/constants';
import type { Event, FeedbackFormData } from '../../lib/types';
import { Spinner, ErrorMessage, Button, Input, Card } from '../../components/ui';
import { Star, Sparkles, Send } from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good & Inspiring',
  4: 'Very Memorable',
  5: 'Exceptional Gathering',
};


export default function Feedback() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<FeedbackFormData>({
    email: '',
    rating: 0,
    what_stood_out: '',
    what_to_improve: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', eventSlug!)
          .eq('is_published', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setEvent(data as Event);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventSlug]);

  const validateField = useCallback(
    (name: keyof FeedbackFormData, value: string | number): string | undefined => {
      switch (name) {
        case 'email':
          if (!value) return 'Please enter your email address.';
          if (typeof value === 'string' && !validateEmail(value))
            return 'Please enter a valid email address.';
          break;
        case 'rating':
          if (!value || value === 0) return 'Please select a rating.';
          break;
      }
      return undefined;
    },
    []
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    if (touched.has('email')) {
      const error = validateField('email', value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) next.email = error;
        else delete next.email;
        return next;
      });
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => new Set(prev).add('email'));
    const error = validateField('email', formData.email);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next.email = error;
      else delete next.email;
      return next;
    });
  };

  const handleRatingSelect = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    setTouched((prev) => new Set(prev).add('rating'));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.rating;
      return next;
    });
  };

  const handleRatingKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRatingSelect(rating);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleRatingSelect(Math.min(5, rating + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleRatingSelect(Math.max(1, rating - 1));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (value.length <= 500) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {};

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const ratingError = validateField('rating', formData.rating);
    if (ratingError) newErrors.rating = ratingError;

    setErrors(newErrors);
    setTouched(new Set(['email', 'rating']));

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email && emailRef.current) {
        emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailRef.current.focus();
      } else if (newErrors.rating && ratingRef.current) {
        ratingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ratingRef.current.focus();
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase.rpc('submit_feedback', {
        p_event_slug: eventSlug!,
        p_email: formData.email.trim().toLowerCase(),
        p_rating: formData.rating,
        p_what_stood_out: formData.what_stood_out.trim() || null,
        p_what_to_improve: formData.what_to_improve.trim() || null,
      });

      if (error) throw error;

      const result = data as { status: string; matched: boolean };

      navigate(`/feedback/${eventSlug}/done`, {
        state: {
          status: result.status,
          matched: result.matched,
          eventTitle: event?.title,
        },
      });
    } catch {
      setSubmitError(
        'Failed to submit feedback. Please check your connection and retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8 text-teal" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <Card className="text-center py-12">
        <h1 className="font-heading text-2xl font-bold text-navy mb-2">
          Event Not Found
        </h1>
        <p className="text-sm text-gray">
          Please check the exit QR code or ask a HACSA staff member.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-10 shadow-sm border border-border">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal/10 text-teal mb-2">
          Exit Survey
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight mb-1">
          How was your experience?
        </h1>
        <p className="font-aside text-teal text-xl font-bold">
          ~ takes under 60 seconds
        </p>
        <p className="text-xs text-gray mt-1">
          {event.title}
        </p>
      </div>

      {submitError && (
        <div className="mb-6">
          <ErrorMessage message={submitError} onRetry={handleSubmit} />
        </div>
      )}

      <div className="space-y-6">
        <Input
          ref={emailRef}
          label="The email you registered with *"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="kwame@example.com"
          helperText="This links your feedback to your check-in demographics."
          value={formData.email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          error={errors.email}
        />

        {/* 5-Star Interactive Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink font-body" id="rating-label">
            Overall Event Rating *
          </label>
          <div
            ref={ratingRef}
            role="radiogroup"
            aria-labelledby="rating-label"
            className="flex gap-2.5"
            tabIndex={-1}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={formData.rating === star}
                aria-label={`${star} star — ${RATING_LABELS[star]}`}
                onClick={() => handleRatingSelect(star)}
                onKeyDown={(e) => handleRatingKeyDown(e, star)}
                className={`w-13 h-13 flex items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer ${
                  formData.rating >= star
                    ? 'bg-gold/15 border-gold text-gold scale-105 shadow-2xs'
                    : 'border-border bg-white text-locked-outline hover:border-teal/50 hover:bg-cream/40'
                }`}
              >
                <Star
                  className={`w-7 h-7 ${
                    formData.rating >= star ? 'fill-gold text-gold' : 'fill-transparent text-locked-outline'
                  }`}
                  strokeWidth={1.75}
                />
              </button>
            ))}
          </div>

          {formData.rating > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal tracking-wide pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{RATING_LABELS[formData.rating]}</span>
            </div>
          )}
          {errors.rating && (
            <p className="text-xs font-medium text-clay" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        {/* What stood out */}
        <div className="space-y-1.5">
          <label htmlFor="what_stood_out" className="block text-sm font-semibold text-ink">
            What stood out to you?
          </label>
          <textarea
            id="what_stood_out"
            name="what_stood_out"
            rows={3}
            maxLength={500}
            value={formData.what_stood_out}
            onChange={handleTextChange}
            placeholder="Key moments, speakers, cultural performances..."
            className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-base text-ink placeholder:text-gray/50 transition-all focus:border-teal focus:ring-1 focus:ring-teal resize-none"
          />
          <p className="text-xs text-gray text-right">
            {formData.what_stood_out.length}/500 characters
          </p>
        </div>

        {/* What to improve */}
        <div className="space-y-1.5">
          <label htmlFor="what_to_improve" className="block text-sm font-semibold text-ink">
            What could be improved?
          </label>
          <textarea
            id="what_to_improve"
            name="what_to_improve"
            rows={3}
            maxLength={500}
            value={formData.what_to_improve}
            onChange={handleTextChange}
            placeholder="Logistics, seating, discussions, future topics..."
            className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-base text-ink placeholder:text-gray/50 transition-all focus:border-teal focus:ring-1 focus:ring-teal resize-none"
          />
          <p className="text-xs text-gray text-right">
            {formData.what_to_improve.length}/500 characters
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <span>{submitting ? 'Submitting Feedback…' : 'Submit My Feedback'}</span>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
