import { apiClient } from "@/lib/api-client";
import { User, UserUpdateInput } from "@/types";

export const usersService = {
  getById(id: string) {
    return apiClient.request<User>(`/api/users/${id}`);
  },
  /** `accessToken` override is only used right after login/register, before the session is persisted. */
  getByEmail(email: string, accessToken?: string) {
    return apiClient.request<User>("/api/users", { query: { email }, accessToken });
  },
  /**
   * ATENÇÃO: `PUT /api/users/{id}` ainda NÃO existe no backend (`UserController` só tem
   * POST/GET/DELETE). O contrato assumido é body `{name, phone}` → `UserResponseDto`, espelhando
   * `UserRequestDto`. Enquanto o endpoint não subir, esta chamada volta 404/405 e a UI avisa.
   */
  update(id: string, input: UserUpdateInput) {
    return apiClient.request<User>(`/api/users/${id}`, { method: "PUT", body: input });
  },
  async deleteById(id: string) {
    await apiClient.request<void>(`/api/users/${id}`, { method: "DELETE" });
  },
};
