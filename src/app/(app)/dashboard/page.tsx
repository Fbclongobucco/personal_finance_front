"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, BarChart3, PieChart, Plus, Wallet } from "lucide-react";

import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { TransactionFormModal } from "@/components/forms/TransactionFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { useCurrentUser } from "@/hooks/use-user";
import { useDeleteTransaction, useMonthSummary, useSettleTransaction, useTransactions } from "@/hooks/use-transactions";
import {
  buildCategoryBreakdown,
  buildMonthlySeries,
  currentMonth,
  monthFilters,
  monthLabel,
  shiftMonth,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/formatters";
import { extractErrorMessage } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

const MONTHS_BACK = 6;

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const toast = useToast();

  const month = useMemo(() => currentMonth(), []);
  const { data: transactions, isLoading, summary } = useMonthSummary(month);
  const settleTransaction = useSettleTransaction();
  const deleteTransaction = useDeleteTransaction();

  // Os gráficos olham uma janela maior: do início do mês mais antigo até o fim do mês corrente.
  const chartFilters = useMemo(
    () => ({ start: monthFilters(shiftMonth(month, -(MONTHS_BACK - 1))).start, end: monthFilters(month).end }),
    [month]
  );
  const { data: chartTransactions, isLoading: isChartLoading } = useTransactions(chartFilters);

  const recent = useMemo(
    () => [...(transactions ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [transactions]
  );

  const monthlySeries = useMemo(() => buildMonthlySeries(chartTransactions ?? [], MONTHS_BACK), [chartTransactions]);
  const hasMonthlyData = monthlySeries.some((point) => point.income > 0 || point.expense > 0);

  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(transactions ?? []), [transactions]);
  const hasCategoryData = categoryBreakdown.length > 0;

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
      <PageHeader
        title={`Olá, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Aqui está um resumo do seu mês."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova transação
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-transparent bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-sm">
          <div className="flex items-center gap-2 text-brand-100">
            <Wallet className="h-4 w-4" />
            <p className="text-sm font-medium">Saldo do mês</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(summary.balance)}</p>
          <p className="mt-1 text-xs text-brand-100">
            Receitas menos despesas de {monthLabel(month).toLowerCase()}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink-500">
            <ArrowUpCircle className="h-4 w-4 text-money-600" />
            <p className="text-sm">Receitas no mês</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-money-700">{formatCurrency(summary.income)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink-500">
            <ArrowDownCircle className="h-4 w-4 text-brand-600" />
            <p className="text-sm">Despesas no mês</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-700">{formatCurrency(summary.expense)}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">Receitas x despesas (últimos {MONTHS_BACK} meses)</h2>
          {isChartLoading ? (
            <Spinner label="Carregando gráfico…" />
          ) : hasMonthlyData ? (
            <MonthlyBarChart data={monthlySeries} />
          ) : (
            <EmptyState icon={BarChart3} title="Sem dados suficientes" description="Registre transações para ver a evolução mensal." />
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">Despesas por categoria no mês</h2>
          {isLoading ? (
            <Spinner label="Carregando gráfico…" />
          ) : hasCategoryData ? (
            <CategoryPieChart data={categoryBreakdown} />
          ) : (
            <EmptyState icon={PieChart} title="Sem despesas neste mês" description="As despesas categorizadas aparecerão aqui." />
          )}
        </Card>
      </div>

      {summary.pending.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink-800">Despesas pendentes</h2>
            <Badge tone="warning">{summary.pending.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {summary.pending.map((transaction) => (
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
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink-800">Transações do mês</h2>
        {isLoading ? (
          <Spinner label="Carregando transações…" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhuma transação neste mês"
            description="Registre sua primeira receita ou despesa para começar a acompanhar seu saldo."
            action={<Button onClick={() => setModalOpen(true)}>Nova transação</Button>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((transaction) => (
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

      <TransactionFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
