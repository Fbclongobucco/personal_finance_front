"use client";

import { Transaction } from "@/domain/entities/transaction";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from "@/presentation/lib/formatters";
import { cn } from "@/presentation/lib/cn";
import { CheckCircle2, Trash2 } from "lucide-react";

export function TransactionRow({
  transaction,
  onSettle,
  onDelete,
  isSettling,
  isDeleting,
}: {
  transaction: Transaction;
  onSettle: () => void;
  onDelete: () => void;
  isSettling?: boolean;
  isDeleting?: boolean;
}) {
  const isIncome = transaction.category.type === "INCOME";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-ink-900">{transaction.description}</p>
          <Badge tone={isIncome ? "money" : "brand"}>{transaction.category.name}</Badge>
          {!transaction.paid && <Badge tone="warning">Pendente</Badge>}
        </div>
        <p className="mt-1 text-xs text-ink-400">
          {formatDateTime(transaction.createdAt)} · {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className={cn("text-base font-semibold whitespace-nowrap", isIncome ? "text-money-700" : "text-brand-700")}>
          {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
        </p>
        <div className="flex items-center gap-1">
          {!transaction.paid && (
            <Button variant="ghost" size="sm" onClick={onSettle} isLoading={isSettling} title="Dar baixa">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Dar baixa</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} isLoading={isDeleting} title="Excluir">
            <Trash2 className="h-4 w-4 text-ink-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
