import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, options, groups, placeholder, id, className = '', ...props },
    ref
  ) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={selectId} className="block text-sm font-semibold text-ink font-body">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink min-h-[48px] transition-all focus:border-teal focus:ring-1 focus:ring-teal appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%231D3A58%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10 ${
            error ? 'border-clay' : 'border-border'
          } ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [error && errorId, helperText && helperId]
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options &&
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          {groups &&
            groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
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

Select.displayName = 'Select';
