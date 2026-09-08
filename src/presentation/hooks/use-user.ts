import { User } from "@/domain/entities/user";
import { container } from "@/infrastructure/container";
import { useAuth } from "@/presentation/providers/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Live user profile (balance included) — refetched after any transaction mutation. */
export function useCurrentUser() {
  const { session, refreshUser } = useAuth();
  const userId = session?.user.id;

  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const user = await container.users.getById(userId!);
      refreshUser(user);
      return user;
    },
    enabled: Boolean(userId),
    initialData: session?.user,
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => container.users.deleteById(id),
    onSuccess: () => queryClient.clear(),
  });
}
