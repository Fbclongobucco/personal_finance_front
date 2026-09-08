import { cn } from "@/presentation/lib/cn";

/** Growth-bars mark: brand-red badge, ascending bars finishing in the money-green accent. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="#8f1d2a" />
      <rect x="8" y="24" width="6" height="10" rx="1.5" fill="#fbe1e3" />
      <rect x="17" y="17" width="6" height="17" rx="1.5" fill="#ffffff" />
      <rect x="26" y="8" width="6" height="26" rx="1.5" fill="#34d399" />
    </svg>
  );
}

export function Logo({
  className,
  markSize = 32,
  withWordmark = true,
}: {
  className?: string;
  markSize?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      {withWordmark && (
        <span className="text-sm font-bold leading-tight tracking-tight text-ink-900 sm:text-base">
          Personal Finance <span className="text-brand-700">App</span>
        </span>
      )}
    </span>
  );
}
