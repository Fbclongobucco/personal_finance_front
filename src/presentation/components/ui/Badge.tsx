import { cn } from "@/presentation/lib/cn";

type Tone = "neutral" | "money" | "brand" | "warning";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  money: "bg-money-100 text-money-800",
  brand: "bg-brand-100 text-brand-800",
  warning: "bg-amber-100 text-amber-800",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_STYLES[tone], className)}>
      {children}
    </span>
  );
}
