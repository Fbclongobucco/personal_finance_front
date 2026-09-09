import { Transaction, TransactionFilters, TransactionInput } from "@/types";
import { currentMonth, MonthRef, monthFilters, summarize } from "@/lib/analytics";
import { transactionsService } from "@/services/transactions";
import { useAuth } from "@/providers/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function useTransactions(filters?: TransactionFilters) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId, filters],
    queryFn: () => transactionsService.list(userId!, filters),
    enabled: Boolean(userId),
  });
}

/**
 * Transações + totais de um mês de calendário (padrão: o mês corrente). Compartilha a query key
 * com `useTransactions`, então telas diferentes reaproveitam o mesmo cache.
 */
export function useMonthSummary(month?: MonthRef) {
  const ref = useMemo(() => month ?? currentMonth(), [month]);
  const filters = useMemo(() => monthFilters(ref), [ref]);
  const query = useTransactions(filters);
  const summary = useMemo(() => summarize(query.data), [query.data]);
  return { ...query, month: ref, summary };
}

function useInvalidateAfterMutation() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["user", session?.user.id] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsService.create(input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: invalidate,
  });
}

export function useSettleTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => transactionsService.settle(id),
    onSuccess: invalidate,
  });
}
