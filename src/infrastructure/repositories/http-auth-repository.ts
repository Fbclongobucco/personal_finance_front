import { LoginInput, RegisterInput, TokenPair, User } from "@/domain/entities/user";
import { AuthRepository } from "@/domain/repositories/auth-repository";
import { apiClient } from "@/infrastructure/http/api-client";

export function createAuthRepository(): AuthRepository {
  return {
    login(input: LoginInput) {
      return apiClient.request<TokenPair>("/auth/login", { method: "POST", body: input, anonymous: true });
    },
    register(input: RegisterInput) {
      return apiClient.request<User>("/auth/register", { method: "POST", body: input, anonymous: true });
    },
    refresh(refreshToken: string) {
      return apiClient.request<TokenPair>("/auth/refresh", { method: "POST", body: { refreshToken }, anonymous: true });
    },
  };
}
