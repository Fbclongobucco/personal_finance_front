import { Transaction, TransactionFilters, TransactionInput } from "@/domain/entities/transaction";
import { container } from "@/infrastructure/container";
import { useAuth } from "@/presentation/providers/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTransactions(filters?: TransactionFilters) {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId, filters],
    queryFn: () => container.transactions.list(userId!, filters),
    enabled: Boolean(userId),
  });
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
    mutationFn: (input: TransactionInput) => container.transactions.create(input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => container.transactions.delete(id),
    onSuccess: invalidate,
  });
}

export function useSettleTransaction() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (id: string) => container.transactions.settle(id),
    onSuccess: invalidate,
  });
}
