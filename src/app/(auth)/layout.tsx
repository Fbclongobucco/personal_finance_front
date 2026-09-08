"use client";

import { Logo } from "@/presentation/components/brand/Logo";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/providers/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Carregando…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <Link href="/">
        <Logo markSize={40} />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
