"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { Role } from "@/lib/supabase/types";

export function Nav({ role, fullName }: { role: Role; fullName: string | null }) {
  const pathname = usePathname();

  const links = [
    ...(role === "owner" ? [{ href: "/", label: "Resultados" }] : []),
    { href: "/pedidos", label: "Pedidos" },
    { href: "/clientes", label: "Clientes" },
    ...(role === "owner" || role === "manager" ? [{ href: "/catalogo", label: "Catálogo" }] : []),
  ];

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">The Market</p>
          <p className="text-sm font-medium">{fullName ?? "Panel de gestión"}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logout}>
            <button
              type="submit"
              className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-danger"
            >
              Salir
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
