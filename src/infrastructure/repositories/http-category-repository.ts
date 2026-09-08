import { Category, CategoryInput, CategoryType } from "@/domain/entities/category";
import { CategoryRepository } from "@/domain/repositories/category-repository";
import { apiClient } from "@/infrastructure/http/api-client";

export function createCategoryRepository(): CategoryRepository {
  return {
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
}
