export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  /** Balance after pending (unpaid) expenses are subtracted — returned by the backend alongside `balance`. */
  settledBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends TokenPair {
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  initialBalance: number;
}
