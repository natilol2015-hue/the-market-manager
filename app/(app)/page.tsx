import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";

const RANGES: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  all: null,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireOwner();
  const { range: rawRange } = await searchParams;
  const range = rawRange && rawRange in RANGES ? rawRange : "30";
  const days = RANGES[range];

  const supabase = await createClient();

  let ordersQuery = supabase
    .from("orders")
    .select("id, origin, status, total, created_at");

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    ordersQuery = ordersQuery.gte("created_at", since.toISOString());
  }

  const { data: orders } = await ordersQuery;
  const validOrders = (orders ?? []).filter((o) => o.status !== "cancelado");

  const totalSold = validOrders.reduce((sum, o) => sum + o.total, 0);
  const online = validOrders.filter((o) => o.origin === "online");
  const whatsapp = validOrders.filter((o) => o.origin === "whatsapp");
  const onlineTotal = online.reduce((sum, o) => sum + o.total, 0);
  const whatsappTotal = whatsapp.reduce((sum, o) => sum + o.total, 0);

  const orderIds = validOrders.map((o) => o.id);
  let topProducts: { name: string; quantity: number; total: number }[] = [];

  if (orderIds.length) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price, order_id")
      .in("order_id", orderIds);

    const totals = new Map<string, { quantity: number; total: number }>();
    for (const item of items ?? []) {
      const entry = totals.get(item.product_name) ?? { quantity: 0, total: 0 };
      entry.quantity += item.quantity;
      entry.total += item.quantity * item.unit_price;
      totals.set(item.product_name, entry);
    }
    topProducts = Array.from(totals.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  const rangeLabels: { label: string; value: string }[] = [
    { label: "7 días", value: "7" },
    { label: "30 días", value: "30" },
    { label: "90 días", value: "90" },
    { label: "Todo", value: "all" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Resultados</h1>
        <div className="flex gap-1">
          {rangeLabels.map((r) => (
            <Link
              key={r.value}
              href={`/?range=${r.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                range === r.value
                  ? "bg-foreground text-background"
                  : "border border-border hover:bg-surface"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Total vendido" value={`$${totalSold.toFixed(2)}`} sub={`${validOrders.length} pedidos`} />
        <Card
          label="Online (página)"
          value={`$${onlineTotal.toFixed(2)}`}
          sub={`${online.length} pedidos`}
        />
        <Card
          label="WhatsApp"
          value={`$${whatsappTotal.toFixed(2)}`}
          sub={`${whatsapp.length} pedidos`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Productos más vendidos</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Unidades</th>
                <th className="px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">${p.total.toFixed(2)}</td>
                </tr>
              ))}
              {!topProducts.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    Sin datos para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}
