import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, id, className = '', ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-semibold text-ink font-body">
          {label}
        </label>
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink min-h-[48px] placeholder:text-gray/50 transition-all focus:border-teal focus:ring-1 focus:ring-teal ${
              rightElement ? 'pr-11' : ''
            } ${error ? 'border-clay' : 'border-border'} ${className}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              [error && errorId, helperText && helperId]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p id={helperId} className="text-xs text-gray">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs font-medium text-clay" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
