import { AuthSession } from "../entities/user";

/** Persists the authenticated session across page reloads. */
export interface SessionStore {
  getSession(): AuthSession | null;
  saveSession(session: AuthSession): void;
  clearSession(): void;
}
