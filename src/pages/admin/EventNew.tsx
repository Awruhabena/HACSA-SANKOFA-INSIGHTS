import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, Input, Card } from '../../components/ui';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EventNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !eventDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const baseSlug = generateSlug(title.trim());

    if (!baseSlug) {
      setError('Please use a title containing letters or numbers.');
      setSubmitting(false);
      return;
    }

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

        const { data, error: insertError } = await supabase
          .from('events')
          .insert({
            title: title.trim(),
            slug,
            location: location.trim(),
            event_date: eventDate,
            description: description.trim() || null,
            is_published: true,
          })
          .select()
          .single();

        if (!insertError) {
          navigate(`/admin/events/${data.id}`);
          return;
        }

        const isDuplicate =
          insertError.code === '23505' ||
          insertError.message?.includes('unique') ||
          insertError.message?.includes('duplicate');

        if (!isDuplicate) throw insertError;
        // duplicate slug — loop retries with the next suffix
      }

      setError('Could not create a unique URL for this event. Try a different title.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-form mx-auto">
      <Card className="p-8 sm:p-10 shadow-sm">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-navy">
            Create Heritage Event
          </h1>
          <p className="text-xs text-gray mt-1">
            Setting up an event generates unique Registration and Feedback URLs.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-clay/20 bg-clay/5 p-3.5 text-xs font-semibold text-clay">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="event-title"
            label="Event Title *"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sankofa Heritage Gala 2026"
          />

          <Input
            id="event-location"
            label="Location *"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Accra International Conference Centre"
          />

          <Input
            id="event-date"
            label="Event Date *"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <div className="space-y-1.5">
            <label htmlFor="event-description" className="block text-sm font-semibold text-ink">
              Description (Optional)
            </label>
            <textarea
              id="event-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-base text-ink placeholder:text-gray/50 transition-all focus:border-teal focus:ring-1 focus:ring-teal resize-none"
              placeholder="Provide context for attendees"
            />
          </div>

          <div className="pt-3">
            <Button
              onClick={handleSubmit}
              loading={submitting}
              variant="primary"
              className="w-full"
            >
              Create Event & Generate QR Codes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
