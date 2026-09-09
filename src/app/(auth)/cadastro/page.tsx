"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/FormField";
import { RegisterFormValues, registerSchema } from "@/lib/validation";
import { extractErrorMessage, useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { initialBalance: 0 },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        initialBalance: values.initialBalance,
      });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-ink-900">Criar conta</h1>
      <p className="mt-1 text-sm text-ink-500">Leva menos de um minuto.</p>

      {formError && <p className="mt-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">{formError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input label="Nome completo" autoComplete="name" required {...register("name")} error={errors.name?.message} />
        <Input label="E-mail" type="email" autoComplete="email" required {...register("email")} error={errors.email?.message} />
        <Input
          label="Telefone"
          type="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          required
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          {...register("password")}
          error={errors.password?.message}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <Input
          label="Saldo inicial (R$)"
          type="number"
          step="0.01"
          hint="Quanto você tem disponível hoje. Pode deixar 0."
          required
          {...register("initialBalance")}
          error={errors.initialBalance?.message}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
