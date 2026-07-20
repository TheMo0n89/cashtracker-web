import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl border bg-[var(--color-background)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-[var(--color-text-muted)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]' : 'border-[var(--color-surface-border)] hover:border-white/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--color-danger)] font-medium animate-fade-in pl-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
