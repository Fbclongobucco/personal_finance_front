import { User } from "@/domain/entities/user";
import { UserRepository } from "@/domain/repositories/user-repository";
import { apiClient } from "@/infrastructure/http/api-client";

export function createUserRepository(): UserRepository {
  return {
    getById(id: string) {
      return apiClient.request<User>(`/api/users/${id}`);
    },
    getByEmail(email: string, accessToken?: string) {
      return apiClient.request<User>("/api/users", { query: { email }, accessToken });
    },
    async deleteById(id: string) {
      await apiClient.request<void>(`/api/users/${id}`, { method: "DELETE" });
    },
  };
}
