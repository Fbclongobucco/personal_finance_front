import { AuthSession } from "@/domain/entities/user";
import { SessionStore } from "@/domain/repositories/session-store";

const STORAGE_KEY = "grana.session";

function read(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function write(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Implements the domain SessionStore contract on top of localStorage. */
export const sessionStore: SessionStore = {
  getSession: read,
  saveSession: write,
  clearSession() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

/**
 * Lower-level accessors used only by the HTTP client, which needs the raw
 * tokens on every request but has no reason to know about the rest of the
 * session shape.
 */
export const tokenAccessor = {
  getAccessToken(): string | null {
    return read()?.accessToken ?? null;
  },
  getRefreshToken(): string | null {
    return read()?.refreshToken ?? null;
  },
  updateTokens(accessToken: string, refreshToken: string) {
    const current = read();
    if (!current) return;
    write({ ...current, accessToken, refreshToken });
  },
  clear() {
    sessionStore.clearSession();
  },
};
