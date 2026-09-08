import { User } from "../entities/user";

export interface UserRepository {
  getById(id: string): Promise<User>;
  /** `accessToken` override is only used right after login/register, before the session is persisted. */
  getByEmail(email: string, accessToken?: string): Promise<User>;
  deleteById(id: string): Promise<void>;
}
