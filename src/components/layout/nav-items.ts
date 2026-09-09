import { ArrowLeftRight, CalendarRange, LayoutDashboard, Tags, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/historico", label: "Histórico", icon: CalendarRange },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;
