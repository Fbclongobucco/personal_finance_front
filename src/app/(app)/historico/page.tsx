"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CalendarRange, ChevronLeft, ChevronRight, PieChart, Wallet } from "lucide-react";

import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useDeleteTransaction, useMonthSummary, useSettleTransaction } from "@/hooks/use-transactions";
import {
  buildCategoryBreakdown,
  currentMonth,
  monthKey,
  monthLabel,
  previousMonths,
  shiftMonth,
} from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/formatters";
import { extractErrorMessage } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

/** Quantos meses anteriores ficam disponíveis como atalho. */
const QUICK_MONTHS = 12;

export default function HistoryPage() {
  const toast = useToast();
  const thisMonth = useMemo(() => currentMonth(), []);
  const quickMonths = useMemo(() => previousMonths(QUICK_MONTHS), []);

  // Abre no mês passado — é o histórico, o mês corrente já é o painel.
  const [selected, setSelected] = useState(() => shiftMonth(currentMonth(), -1));
  const isCurrentMonth = monthKey(selected) === monthKey(thisMonth);

  const { data: transactions, isLoading, summary } = useMonthSummary(selected);
  const settleTransaction = useSettleTransaction();
  const deleteTransaction = useDeleteTransaction();

  const breakdown = useMemo(() => buildCategoryBreakdown(transactions ?? []), [transactions]);
  const sorted = useMemo(
    () => [...(transactions ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [transactions]
  );

  async function handleSettle(id: string) {
    try {
      await settleTransaction.mutateAsync(id);
      toast.success("Despesa marcada como paga.");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTransaction.mutateAsync(id);
      toast.success("Transação excluída.");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader title="Histórico" description="Consulte o resumo e as transações de meses anteriores." />

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={() => setSelected(shiftMonth(selected, -1))} title="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <p className="text-center text-sm font-semibold text-ink-900 sm:text-base">{monthLabel(selected)}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelected(shiftMonth(selected, 1))}
            disabled={isCurrentMonth}
            title="Próximo mês"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {quickMonths.map((month) => {
            const active = monthKey(month) === monthKey(selected);
            return (
              <button
                key={monthKey(month)}
                onClick={() => setSelected(month)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-brand-700 bg-brand-50 text-brand-800"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                {monthLabel(month)}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-transparent bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-sm">
          <div className="flex items-center gap-2 text-brand-100">
            <Wallet className="h-4 w-4" />
            <p className="text-sm font-medium">Saldo do mês</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(summary.balance)}</p>
          <p className="mt-1 text-xs text-brand-100">Receitas menos despesas de {monthLabel(selected).toLowerCase()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink-500">
            <ArrowUpCircle className="h-4 w-4 text-money-600" />
            <p className="text-sm">Receitas</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-money-700">{formatCurrency(summary.income)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink-500">
            <ArrowDownCircle className="h-4 w-4 text-brand-600" />
            <p className="text-sm">Despesas</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-700">{formatCurrency(summary.expense)}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-800">Despesas por categoria</h2>
        {isLoading ? (
          <Spinner label="Carregando gráfico…" />
        ) : breakdown.length > 0 ? (
          <CategoryPieChart data={breakdown} />
        ) : (
          <EmptyState icon={PieChart} title="Sem despesas neste mês" description="Nada foi gasto no período selecionado." />
        )}
      </Card>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink-800">Transações do mês</h2>
          {summary.pending.length > 0 && <Badge tone="warning">{summary.pending.length} pendente(s)</Badge>}
        </div>
        {isLoading ? (
          <Spinner label="Carregando transações…" />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nenhuma transação neste mês"
            description="Escolha outro mês para ver o que foi registrado."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onSettle={() => handleSettle(transaction.id)}
                onDelete={() => handleDelete(transaction.id)}
                isSettling={settleTransaction.isPending && settleTransaction.variables === transaction.id}
                isDeleting={deleteTransaction.isPending && deleteTransaction.variables === transaction.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
