"use client";

import { Logo } from "@/components/brand/Logo";
import { useMonthSummary } from "@/hooks/use-transactions";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/formatters";

export function MobileTopBar() {
  const { summary } = useMonthSummary();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <Logo markSize={28} />
      <p className={cn("text-sm font-semibold", summary.balance < 0 ? "text-brand-700" : "text-money-700")}>
        {formatCurrency(summary.balance)}
      </p>
    </header>
  );
}
