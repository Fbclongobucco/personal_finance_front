import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-ink-100 bg-white p-5 shadow-sm", className)}>{children}</div>;
}
