import { ArrowLeftRight, LayoutDashboard, Tags, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;
