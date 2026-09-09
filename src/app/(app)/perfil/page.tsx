"use client";

import { useState } from "react";
import { LogOut, Mail, Pencil, Phone, ShieldCheck, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProfileFormModal } from "@/components/forms/ProfileFormModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCurrentUser, useDeleteAccount } from "@/hooks/use-user";
import { formatDate } from "@/lib/formatters";
import { extractErrorMessage, useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const { data: user } = useCurrentUser();
  const deleteAccount = useDeleteAccount();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDeleteAccount() {
    if (!session) return;
    try {
      await deleteAccount.mutateAsync(session.user.id);
      toast.success("Conta excluída. Até mais!");
      logout();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title="Perfil"
        description="Suas informações de conta."
        action={
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar perfil
          </Button>
        }
      />

      <Card>
        <div>
          <p className="text-lg font-semibold text-ink-900">{user?.name}</p>
          <Badge tone={user?.role === "ADMIN" ? "brand" : "neutral"} className="mt-1">
            {user?.role === "ADMIN" ? "Administrador" : "Usuário"}
          </Badge>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-ink-100 pt-6 text-sm">
          <div className="flex items-center gap-3 text-ink-700">
            <Mail className="h-4 w-4 text-ink-400" />
            {user?.email}
          </div>
          <div className="flex items-center gap-3 text-ink-700">
            <Phone className="h-4 w-4 text-ink-400" />
            {user?.phone}
          </div>
          <div className="flex items-center gap-3 text-ink-700">
            <Wallet className="h-4 w-4 text-ink-400" />
            Membro desde {formatDate(user?.createdAt)}
          </div>
          {user?.role === "ADMIN" && (
            <div className="flex items-center gap-3 text-ink-700">
              <ShieldCheck className="h-4 w-4 text-ink-400" />
              Acesso administrativo: pode visualizar dados e categorias de outros usuários.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-ink-100 pt-6 sm:flex-row">
          <Button variant="secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Excluir minha conta
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir conta"
        description="Essa ação é permanente e removerá seu acesso e seus dados. Deseja continuar?"
        confirmLabel="Excluir conta"
        danger
        isLoading={deleteAccount.isPending}
      />

      <ProfileFormModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
