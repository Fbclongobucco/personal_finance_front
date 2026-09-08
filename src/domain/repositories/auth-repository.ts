import { LoginInput, RegisterInput, TokenPair, User } from "../entities/user";

export interface AuthRepository {
  login(input: LoginInput): Promise<TokenPair>;
  register(input: RegisterInput): Promise<User>;
  refresh(refreshToken: string): Promise<TokenPair>;
}
