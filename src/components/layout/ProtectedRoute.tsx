import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Spinner } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let resolvedByListener = false;

    // Subscribe FIRST so we never miss an auth change that lands
    // while the initial getSession() call is still in flight.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      resolvedByListener = true;
      setAuthenticated(!!session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // If the listener already reported a newer state, don't overwrite it
      // with this potentially stale result.
      if (cancelled || resolvedByListener) return;
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <Spinner className="h-8 w-8 text-clay" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
