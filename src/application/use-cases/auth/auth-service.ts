import { AuthSession, LoginInput, RegisterInput, TokenPair } from "@/domain/entities/user";
import { AuthRepository } from "@/domain/repositories/auth-repository";
import { SessionStore } from "@/domain/repositories/session-store";
import { UserRepository } from "@/domain/repositories/user-repository";

/**
 * Orchestrates login/register against an API that only hands back tokens (no
 * profile data). The full user profile is fetched right after, using the
 * fresh access token explicitly (no session is persisted yet to read it from).
 */
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionStore: SessionStore
  ) {}

  restoreSession(): AuthSession | null {
    return this.sessionStore.getSession();
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const tokens = await this.authRepository.login(input);
    return this.completeSession(tokens, input.email);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    await this.authRepository.register(input);
    const tokens = await this.authRepository.login({ email: input.email, password: input.password });
    return this.completeSession(tokens, input.email);
  }

  logout() {
    this.sessionStore.clearSession();
  }

  private async completeSession(tokens: TokenPair, email: string): Promise<AuthSession> {
    const user = await this.userRepository.getByEmail(email, tokens.accessToken);
    const session: AuthSession = { ...tokens, user };
    this.sessionStore.saveSession(session);
    return session;
  }
}
