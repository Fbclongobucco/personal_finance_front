"use client";

import { AuthSession, LoginInput, RegisterInput, UserRole } from "@/domain/entities/user";
import { ApiError } from "@/domain/errors/api-error";
import { sessionEvents } from "@/infrastructure/auth/session-events";
import { container } from "@/infrastructure/container";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  isAdmin: boolean;
  role: UserRole | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Merges fresh user fields (e.g. balance) into the in-memory session without touching tokens. */
  refreshUser: (user: AuthSession["user"]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const restored = container.auth.restoreSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(restored);
    setStatus(restored ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    return sessionEvents.onExpired(() => {
      setSession(null);
      setStatus("unauthenticated");
      router.replace("/login?expired=1");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(input: LoginInput) {
    const result = await container.auth.login(input);
    setSession(result);
    setStatus("authenticated");
  }

  async function register(input: RegisterInput) {
    const result = await container.auth.register(input);
    setSession(result);
    setStatus("authenticated");
  }

  function logout() {
    container.auth.logout();
    setSession(null);
    setStatus("unauthenticated");
    router.replace("/");
  }

  function refreshUser(user: AuthSession["user"]) {
    setSession((current) => (current ? { ...current, user } : current));
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        role: session?.user.role ?? null,
        isAdmin: session?.user.role === "ADMIN",
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}
