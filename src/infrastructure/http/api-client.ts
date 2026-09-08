import { ApiError, NetworkError } from "@/domain/errors/api-error";
import { sessionEvents } from "@/infrastructure/auth/session-events";
import { tokenAccessor } from "@/infrastructure/auth/session-storage";

// Same-origin path, rewritten to the real backend by next.config.ts. Keeps every
// browser request same-origin so the backend's lack of CORS headers is a non-issue.
const BASE_URL = "/backend";

/** Shape of Spring's `ProblemDetail`, returned by the backend's GlobalExceptionHandler on errors. */
interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skips the Authorization header and the 401-refresh dance (login/register/refresh). */
  anonymous?: boolean;
  /** Explicit bearer token to use instead of the stored one — only needed right after
   *  login/register, before a session exists to read the token from. */
  accessToken?: string;
};

/**
 * Single point of contact with the backend. Centralizes:
 * - JSON encoding/decoding
 * - Bearer token attachment
 * - Transparent access-token refresh on an expired-token response, with
 *   request de-duplication so N concurrent calls only trigger one
 *   /auth/refresh round-trip.
 *
 * Spring Boot's SecurityConfig has no httpBasic/formLogin and no custom
 * entry point, so Spring Security 6 answers an unauthenticated request to
 * /api/** with **403 Forbidden — not 401** — including when the bearer token
 * is expired or invalid (the JWT filter just skips auth). That's why 403
 * triggers the same refresh-and-retry as 401 here. The app itself only ever
 * calls /api/** for the signed-in user's own resources, so a 403 on a
 * token-bearing request means the token was rejected, never a legit
 * authorization denial.
 */
class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, anonymous, accessToken } = options;
    const url = buildUrl(path, query);

    const response = await this.dispatch(url, method, body, anonymous, accessToken);

    if ((response.status === 401 || response.status === 403) && !anonymous) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        const retried = await this.dispatch(url, method, body, anonymous);
        return this.parse<T>(retried);
      }
      sessionEvents.emitExpired();
    }

    return this.parse<T>(response);
  }

  private async dispatch(url: string, method: string, body: unknown, anonymous?: boolean, accessTokenOverride?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!anonymous) {
      const token = accessTokenOverride ?? tokenAccessor.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    try {
      return await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new NetworkError();
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<string | null> {
    const refreshToken = tokenAccessor.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        tokenAccessor.clear();
        return null;
      }
      const data = (await response.json()) as { accessToken: string; refreshToken: string };
      tokenAccessor.updateTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      tokenAccessor.clear();
      return null;
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      const problem = (data ?? {}) as ProblemDetail;
      throw new ApiError(response.status, problem.detail ?? "Ocorreu um erro inesperado ao comunicar com o servidor.");
    }

    return data as T;
  }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  // This client only ever runs in the browser (hooks/providers marked "use client"),
  // so window.location is always available when this executes.
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export const apiClient = new ApiClient();
