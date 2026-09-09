import { apiClient } from "@/lib/api-client";
import { sessionStore } from "@/lib/session";
import { usersService } from "@/services/users";
import { AuthSession, LoginInput, RegisterInput, TokenPair, User } from "@/types";

/**
 * The backend only hands back tokens on login (the JWT carries just the e-mail),
 * so the full profile is fetched right after with the fresh access token passed
 * explicitly — no session is persisted yet to read it from.
 */
async function completeSession(tokens: TokenPair, email: string): Promise<AuthSession> {
  const user = await usersService.getByEmail(email, tokens.accessToken);
  const session: AuthSession = { ...tokens, user };
  sessionStore.saveSession(session);
  return session;
}

export const authService = {
  restoreSession(): AuthSession | null {
    return sessionStore.getSession();
  },

  async login(input: LoginInput): Promise<AuthSession> {
    const tokens = await apiClient.request<TokenPair>("/auth/login", { method: "POST", body: input, anonymous: true });
    return completeSession(tokens, input.email);
  },

  /** `POST /auth/register` only creates the user — it never logs you in, hence the login right after. */
  async register(input: RegisterInput): Promise<AuthSession> {
    await apiClient.request<User>("/auth/register", { method: "POST", body: input, anonymous: true });
    return authService.login({ email: input.email, password: input.password });
  },

  logout() {
    sessionStore.clearSession();
  },
};
