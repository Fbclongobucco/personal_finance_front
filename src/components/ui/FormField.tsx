import { cn } from "@/lib/cn";
import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  labelAction?: React.ReactNode;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, required, className, labelAction, children }: FieldWrapperProps) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-brand-700">*</span>}
        </span>
        {labelAction}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink-400">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-400";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, wrapperClassName, className, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <input ref={ref} className={cn(inputBase, error && "border-red-400", className)} {...props} />
    </FieldWrapper>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  labelAction?: React.ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, wrapperClassName, labelAction, className, children, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} labelAction={labelAction} className={wrapperClassName}>
      <select ref={ref} className={cn(inputBase, error && "border-red-400", className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
});
