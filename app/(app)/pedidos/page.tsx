import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { OrderOrigin } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string }>;
}) {
  await getSession();
  const { origin } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (origin === "online" || origin === "whatsapp") {
    query = query.eq("origin", origin as OrderOrigin);
  }

  const [{ data: orders }, { data: clients }] = await Promise.all([
    query,
    supabase.from("clients").select("id, name"),
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const filters: { label: string; value?: string }[] = [
    { label: "Todos" },
    { label: "Online", value: "online" },
    { label: "WhatsApp", value: "whatsapp" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <Link
          href="/pedidos/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
        >
          + Nuevo pedido
        </Link>
      </div>

      <div className="flex gap-1">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/pedidos?origin=${f.value}` : "/pedidos"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              origin === f.value || (!origin && !f.value)
                ? "bg-foreground text-background"
                : "border border-border hover:bg-surface"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Origen</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <Link href={`/pedidos/${o.id}`} className="hover:text-accent">
                    {new Date(o.created_at).toLocaleDateString("es-AR")}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {(o.client_id && clientNameById.get(o.client_id)) ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.origin === "online"
                        ? "bg-accent/15 text-accent"
                        : "bg-foreground/10 text-foreground"
                    }`}
                  >
                    {o.origin === "online" ? "Online" : "WhatsApp"}
                  </span>
                </td>
                <td className="px-4 py-2">{STATUS_LABEL[o.status]}</td>
                <td className="px-4 py-2">${o.total.toFixed(2)}</td>
              </tr>
            ))}
            {!orders?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No hay pedidos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
