import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-white p-6 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
