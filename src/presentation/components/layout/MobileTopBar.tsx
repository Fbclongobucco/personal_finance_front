"use client";

import { Logo } from "@/presentation/components/brand/Logo";
import { useCurrentUser } from "@/presentation/hooks/use-user";
import { cn } from "@/presentation/lib/cn";
import { formatCurrency } from "@/presentation/lib/formatters";

export function MobileTopBar() {
  const { data: user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <Logo markSize={28} />
      <p className={cn("text-sm font-semibold", (user?.balance ?? 0) < 0 ? "text-brand-700" : "text-money-700")}>
        {formatCurrency(user?.balance)}
      </p>
    </header>
  );
}
