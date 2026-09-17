import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  flash?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'teal' | 'navy' | 'gold' | 'gray';
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  flash = false,
  icon,
  badge,
  badgeColor = 'teal',
  accentColor,
}: StatCardProps) {
  const badgeStyles = {
    teal: 'bg-teal/10 text-teal border-teal/20',
    navy: 'bg-navy/10 text-navy border-navy/20',
    gold: 'bg-gold/15 text-amber-700 border-gold/30',
    gray: 'bg-gray/10 text-gray border-gray/20',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-white p-5 shadow-xs transition-all duration-500 hover:shadow-md ${
        flash ? 'bg-gold/15 ring-2 ring-gold/40' : ''
      }`}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className="text-3xl font-heading font-bold text-navy tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream border border-border text-teal">
            {icon}
          </div>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
          {badge && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles[badgeColor]}`}
            >
              {badge}
            </span>
          )}
          {subtext && <p className="text-xs text-gray font-medium">{subtext}</p>}
        </div>
      )}
    </div>
  );
}
