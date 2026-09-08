"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";

import { CategoryType } from "@/domain/entities/category";
import { TransactionFormModal } from "@/presentation/components/forms/TransactionFormModal";
import { Button } from "@/presentation/components/ui/Button";
import { Card } from "@/presentation/components/ui/Card";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { PageHeader } from "@/presentation/components/ui/PageHeader";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { TransactionRow } from "@/presentation/components/transactions/TransactionRow";
import { useDeleteTransaction, useSettleTransaction, useTransactions } from "@/presentation/hooks/use-transactions";
import { endOfDayParam, startOfDayParam, startOfMonth, toDateInputValue } from "@/presentation/lib/formatters";
import { extractErrorMessage } from "@/presentation/providers/auth-provider";
import { useToast } from "@/presentation/providers/toast-provider";

type TypeFilter = "ALL" | CategoryType;

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [startInput, setStartInput] = useState(() => toDateInputValue(startOfMonth(new Date())));
  const [endInput, setEndInput] = useState(() => toDateInputValue(new Date()));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const toast = useToast();

  const filters = useMemo(
    () => ({
      start: startOfDayParam(new Date(`${startInput}T00:00:00`)),
      end: endOfDayParam(new Date(`${endInput}T00:00:00`)),
      type: typeFilter === "ALL" ? undefined : typeFilter,
    }),
    [startInput, endInput, typeFilter]
  );

  const { data: transactions, isLoading } = useTransactions(filters);
  const settleTransaction = useSettleTransaction();
  const deleteTransaction = useDeleteTransaction();

  const sorted = useMemo(() => [...(transactions ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [transactions]);

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
        title="Transações"
        description="Receitas e despesas do período selecionado."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova transação
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-700">De</span>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-700">Até</span>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-700">Tipo</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="ALL">Todas</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <Spinner label="Carregando transações…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhuma transação no período"
          description="Ajuste o filtro de datas ou registre uma nova transação."
          action={<Button onClick={() => setModalOpen(true)}>Nova transação</Button>}
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

      <TransactionFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
