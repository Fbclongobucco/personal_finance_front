import { apiClient } from "@/lib/api-client";
import { Transaction, TransactionFilters, TransactionInput } from "@/types";

export const transactionsService = {
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
