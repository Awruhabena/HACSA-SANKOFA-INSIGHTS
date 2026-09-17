import { useParams, useLocation, Navigate } from 'react-router-dom';
import { Card } from '../../components/ui';
import { CheckCircle2, Info, Globe2 } from 'lucide-react';

export default function FeedbackDone() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const location = useLocation();
  const state = location.state as { status?: string; matched?: boolean } | null;

  if (!state?.status) {
    return <Navigate to={`/feedback/${eventSlug}`} replace />;
  }

  const isAlreadySubmitted = state.status === 'already_submitted';

  return (
    <Card className="text-center py-12 px-6 sm:px-10 shadow-sm space-y-6">
      {isAlreadySubmitted ? (
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
          {isAlreadySubmitted ? 'Feedback Already Recorded' : 'Thank You for Sharing!'}
        </h1>
        <p className="font-aside text-teal text-xl font-bold mt-1">
          ~ every perspective strengthens our heritage
        </p>
      </div>

      <p className="text-gray text-base max-w-md mx-auto leading-relaxed">
        {isAlreadySubmitted
          ? 'We already have your feedback on record. Thank you for helping HACSA elevate future cultural programmes!'
          : 'Your reflections and scores help the HACSA Foundation shape even more impactful cultural gatherings and heritage dialogues.'}
      </p>

      <div className="p-4 rounded-2xl bg-cream border border-border/80 text-xs text-navy font-medium max-w-md mx-auto flex items-center gap-2.5 text-left">
        <Globe2 className="w-4 h-4 text-teal shrink-0" />
        <span><strong className="font-heading">HACSA Foundation:</strong> Preserving heritage, connecting the diaspora, and empowering future generations.</span>
      </div>
    </Card>
  );
}
