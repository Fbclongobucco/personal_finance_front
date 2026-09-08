import { AuthService } from "@/application/use-cases/auth/auth-service";
import { sessionStore } from "@/infrastructure/auth/session-storage";
import { createAuthRepository } from "@/infrastructure/repositories/http-auth-repository";
import { createCategoryRepository } from "@/infrastructure/repositories/http-category-repository";
import { createTransactionRepository } from "@/infrastructure/repositories/http-transaction-repository";
import { createUserRepository } from "@/infrastructure/repositories/http-user-repository";

/**
 * Manual composition root. This is the only place allowed to import both an
 * infrastructure repository and an application service — everything under
 * src/presentation talks to `container.*` only.
 */
function buildContainer() {
  const authRepository = createAuthRepository();
  const userRepository = createUserRepository();
  const categoryRepository = createCategoryRepository();
  const transactionRepository = createTransactionRepository();

  return {
    auth: new AuthService(authRepository, userRepository, sessionStore),
    users: userRepository,
    categories: categoryRepository,
    transactions: transactionRepository,
  };
}

export const container = buildContainer();
