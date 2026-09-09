import { apiClient } from "@/lib/api-client";
import { User } from "@/types";

export const usersService = {
  getById(id: string) {
    return apiClient.request<User>(`/api/users/${id}`);
  },
  /** `accessToken` override is only used right after login/register, before the session is persisted. */
  getByEmail(email: string, accessToken?: string) {
    return apiClient.request<User>("/api/users", { query: { email }, accessToken });
  },
  async deleteById(id: string) {
    await apiClient.request<void>(`/api/users/${id}`, { method: "DELETE" });
  },
};
