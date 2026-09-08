import { Transaction, TransactionFilters, TransactionInput } from "@/domain/entities/transaction";
import { TransactionRepository } from "@/domain/repositories/transaction-repository";
import { apiClient } from "@/infrastructure/http/api-client";

export function createTransactionRepository(): TransactionRepository {
  return {
    list(userId: string, filters?: TransactionFilters) {
      return apiClient.request<Transaction[]>("/api/transactions", {
        query: { userId, start: filters?.start, end: filters?.end, type: filters?.type },
      });
    },
    create(input: TransactionInput) {
      return apiClient.request<Transaction>("/api/transactions", { method: "POST", body: input });
    },
    async delete(id: string) {
      await apiClient.request<void>(`/api/transactions/${id}`, { method: "DELETE" });
    },
    settle(id: string) {
      return apiClient.request<Transaction>(`/api/transactions/${id}/settle`, { method: "PATCH" });
    },
  };
}
