import { User } from "@/types";
import { usersService } from "@/services/users";
import { useAuth } from "@/providers/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Live user profile (balance included) — refetched after any transaction mutation. */
export function useCurrentUser() {
  const { session, refreshUser } = useAuth();
  const userId = session?.user.id;

  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const user = await usersService.getById(userId!);
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
    mutationFn: (id: string) => usersService.deleteById(id),
    onSuccess: () => queryClient.clear(),
  });
}
