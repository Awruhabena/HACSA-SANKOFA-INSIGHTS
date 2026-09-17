import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, Input } from '../../components/ui';
import { ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('Incorrect email or password');
      } else {
        navigate('/admin/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-[420px] rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-sm">
        {/* Brand header with Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 rounded-3xl bg-cream border border-border/80 p-2 items-center justify-center shadow-xs mb-3 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <img
              src="/hacsa-logo.png"
              alt="HACSA Foundation Official Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
            HACSA Foundation
          </h1>
          <p className="text-xs text-gray uppercase tracking-widest mt-1 font-semibold">
            Staff Sign In
          </p>
          <p className="font-aside text-teal text-base mt-1 font-bold">
            ~ Heritage & diaspora analytics
          </p>
        </div>

        {error && (
          <div
            className="mb-6 rounded-2xl border border-clay/20 bg-clay/5 p-3.5 text-xs font-semibold text-clay text-center"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="login-email"
            label="Staff Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="staff@hacsa.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <Input
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray hover:text-navy rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray hover:text-navy transition-colors" />
                ) : (
                  <Eye className="w-4 h-4 text-gray hover:text-navy transition-colors" />
                )}
              </button>
            }
          />

          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              loading={loading}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-center gap-1.5 text-xs text-gray">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>Authorized HACSA Personnel Only</span>
        </div>
      </div>
    </div>
  );
}
