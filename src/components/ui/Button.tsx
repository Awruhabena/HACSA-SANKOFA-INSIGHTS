import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'navy';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'group cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl min-h-[48px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-md active:scale-[0.97] select-none';

  const variants = {
    primary: 'bg-teal text-white hover:bg-teal-pressed active:bg-teal-pressed hover:-translate-y-0.5',
    navy: 'bg-navy text-white hover:bg-navy/90 active:bg-navy/95 hover:-translate-y-0.5',
    secondary: 'bg-white text-ink border border-border hover:bg-cream hover:border-gray/50 hover:-translate-y-0.5',
    ghost: 'text-ink hover:bg-navy/5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 text-current shrink-0" />}
      {children}
    </button>
  );
}
