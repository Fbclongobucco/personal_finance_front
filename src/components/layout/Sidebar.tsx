"use client";

import { Logo } from "@/components/brand/Logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useMonthSummary } from "@/hooks/use-transactions";
import { monthLabel } from "@/lib/analytics";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const { month, summary } = useMonthSummary();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white md:sticky md:top-0 md:flex">
      <div className="border-b border-ink-100 px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 px-4 py-4">
        <p className="text-xs text-ink-400">Saldo de {monthLabel(month).toLowerCase()}</p>
        <p className={cn("text-lg font-semibold", summary.balance < 0 ? "text-brand-700" : "text-money-700")}>
          {formatCurrency(summary.balance)}
        </p>
        <p className="mt-3 truncate text-sm font-medium text-ink-800">{session?.user.name}</p>
        <p className="truncate text-xs text-ink-400">{session?.user.email}</p>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-500 hover:bg-ink-50 hover:text-brand-700"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
