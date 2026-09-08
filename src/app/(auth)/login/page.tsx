"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/presentation/components/ui/Button";
import { Card } from "@/presentation/components/ui/Card";
import { Input } from "@/presentation/components/ui/FormField";
import { LoginFormValues, loginSchema } from "@/presentation/lib/validation";
import { extractErrorMessage, useAuth } from "@/presentation/providers/auth-provider";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      router.replace("/dashboard");
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-ink-900">Entrar</h1>
      <p className="mt-1 text-sm text-ink-500">Acesse sua conta para continuar.</p>

      {expired && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sua sessão expirou. Faça login novamente.
        </p>
      )}
      {formError && <p className="mt-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">{formError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input label="E-mail" type="email" autoComplete="email" required {...register("email")} error={errors.email?.message} />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          {...register("password")}
          error={errors.password?.message}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </Card>
  );
}
