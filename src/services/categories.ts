import { apiClient } from "@/lib/api-client";
import { Category, CategoryInput, CategoryType } from "@/types";

export const categoriesService = {
  list(type?: CategoryType) {
    return apiClient.request<Category[]>("/api/categories", { query: { type } });
  },
  create(input: CategoryInput) {
    return apiClient.request<Category>("/api/categories", { method: "POST", body: input });
  },
  async delete(id: string) {
    await apiClient.request<void>(`/api/categories/${id}`, { method: "DELETE" });
  },
};
