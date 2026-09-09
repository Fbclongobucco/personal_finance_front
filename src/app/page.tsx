"use client";

import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Tags,
  Wallet,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/providers/auth-provider";

const FEATURES = [
  {
    icon: Wallet,
    title: "Saldo do mês em tempo real",
    description:
      "O painel abre no mês corrente e recalcula receitas menos despesas a cada lançamento. Meses anteriores ficam na aba Histórico.",
  },
  {
    icon: Tags,
    title: "Categorias personalizadas",
    description: "Separe receitas e despesas em categorias para entender para onde vai seu dinheiro.",
  },
  {
    icon: CreditCard,
    title: "Formas de pagamento",
    description: "Registre cada transação com Pix, cartão, dinheiro, boleto ou ticket.",
  },
  {
    icon: CheckCircle2,
    title: "Controle de pendências",
    description: 'Marque despesas como pagas ("dar baixa") assim que quitar a conta.',
  },
];

/** Mock do painel no hero. Os valores fecham com os cards: 4.500,00 - 1.251,10 = 3.248,90. */
const PREVIEW_TRANSACTIONS = [
  { label: "Salário", income: true, pending: false, value: "+ R$ 4.500,00" },
  { label: "Supermercado", income: false, pending: false, value: "- R$ 612,40" },
  { label: "Aluguel", income: false, pending: true, value: "- R$ 550,00" },
  { label: "Assinaturas", income: false, pending: false, value: "- R$ 88,70" },
];

const STEPS = [
  { number: "1", title: "Crie sua conta", description: "Cadastro rápido com e-mail, telefone e seu saldo inicial." },
  { number: "2", title: "Registre transações", description: "Lance receitas e despesas com categoria e forma de pagamento." },
  { number: "3", title: "Acompanhe seu saldo", description: "Veja seu saldo, pendências e histórico sempre à mão." },
];

export default function LandingPage() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Ir para o painel
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button size="sm">Criar conta</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Controle suas finanças pessoais sem complicação.
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-600 sm:text-lg">
              Registre receitas e despesas, organize por categoria e acompanhe seu saldo em tempo real —
              tudo em um app simples, direto ao ponto e disponível no celular ou no computador.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={isAuthenticated ? "/dashboard" : "/cadastro"} className="sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  {isAuthenticated ? "Ir para o painel" : "Começar grátis"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/login" className="sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Já tenho conta
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <Card className="border-ink-200 shadow-lg">
              <div className="rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white">
                <div className="flex items-center gap-2 text-brand-100">
                  <Wallet className="h-3.5 w-3.5" />
                  <p className="text-xs font-medium">Saldo do mês</p>
                </div>
                <p className="mt-1 text-2xl font-bold">R$ 3.248,90</p>
                <p className="mt-1 text-[11px] text-brand-100">Receitas menos despesas do mês</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center gap-1.5 text-ink-500">
                    <ArrowUpCircle className="h-3.5 w-3.5 text-money-600" />
                    <p className="text-[11px]">Receitas</p>
                  </div>
                  <p className="mt-1 text-base font-bold text-money-700">R$ 4.500,00</p>
                </div>
                <div className="rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center gap-1.5 text-ink-500">
                    <ArrowDownCircle className="h-3.5 w-3.5 text-brand-600" />
                    <p className="text-[11px]">Despesas</p>
                  </div>
                  <p className="mt-1 text-base font-bold text-brand-700">R$ 1.251,10</p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {PREVIEW_TRANSACTIONS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 rounded-md border border-ink-100 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm text-ink-700">{item.label}</span>
                      {item.pending && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          Pendente
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-sm font-semibold ${item.income ? "text-money-700" : "text-brand-700"}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="border-t border-ink-100 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-ink-900 sm:text-3xl">Tudo que você precisa para organizar sua grana</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="text-center sm:text-left">
                  <feature.icon className="mx-auto h-8 w-8 text-brand-700 sm:mx-0" />
                  <h3 className="mt-3 font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-ink-900 sm:text-3xl">Como funciona</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-ink-100 bg-brand-700 py-14 text-center text-white sm:py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Comece a organizar sua grana hoje</h2>
            <p className="mt-3 text-brand-100">Leva menos de um minuto para criar sua conta.</p>
            <Link href={isAuthenticated ? "/dashboard" : "/cadastro"}>
              <Button size="lg" className="mt-6 bg-white text-brand-700 hover:bg-brand-50">
                {isAuthenticated ? "Ir para o painel" : "Criar conta grátis"}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <Logo markSize={24} />
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} Personal Finance App. Controle financeiro pessoal.</p>
        </div>
      </footer>
    </div>
  );
}
