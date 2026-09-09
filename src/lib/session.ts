import { AuthSession } from "@/types";

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

/** localStorage-backed session (tokens + user profile), survives page reloads. */
export const sessionStore = {
  getSession: read,
  saveSession: write,
  clearSession() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
  /**
   * Lower-level accessors used only by the HTTP client, which needs the raw
   * tokens on every request but has no reason to know about the rest of the
   * session shape.
   */
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
};

/**
 * Lets the api client (which has no business importing React) tell the
 * AuthProvider that the session was invalidated, e.g. because the refresh
 * token expired mid-request.
 */
const EXPIRED_EVENT = "grana:session-expired";

export const sessionEvents = {
  emitExpired() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(EXPIRED_EVENT));
  },
  onExpired(handler: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EXPIRED_EVENT, handler);
    return () => window.removeEventListener(EXPIRED_EVENT, handler);
  },
};
