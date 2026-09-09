"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useCurrentUser, useUpdateUser } from "@/hooks/use-user";
import { ApiError } from "@/lib/api-client";
import { ProfileFormValues, profileSchema } from "@/lib/validation";
import { extractErrorMessage } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

export function ProfileFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (open) reset({ name: user?.name ?? "", phone: user?.phone ?? "" });
  }, [open, user, reset]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateUser.mutateAsync(values);
      toast.success("Perfil atualizado.");
      onClose();
    } catch (error) {
      // Enquanto PUT /api/users/{id} não existir no backend a resposta é 404/405 com o corpo
      // padrão do Spring, que não traz `detail`. Remova este caso quando o endpoint subir.
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
        toast.error("O backend ainda não expõe a edição de perfil (PUT /api/users/{id}).");
        return;
      }
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nome" required placeholder="Seu nome completo" {...register("name")} error={errors.name?.message} />
        <Input
          label="Telefone"
          required
          placeholder="(11) 99999-9999"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <div className="rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-500">
          E-mail e senha não são editáveis por aqui: o e-mail é a identidade do seu token de acesso.
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
