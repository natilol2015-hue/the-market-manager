import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import { OrderForm } from "@/app/(app)/pedidos/order-form";
import { createOrder } from "@/app/actions/orders";

export default async function NuevoPedidoPage() {
  await getSession();
  const supabase = await createClient();

  const [{ data: clients }, { data: products }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("products").select("*").eq("active", true).order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo pedido</h1>
      <div className="max-w-3xl rounded-lg border border-border bg-surface p-6">
        <OrderForm
          action={createOrder}
          clients={clients ?? []}
          products={products ?? []}
          submitLabel="Crear pedido"
        />
      </div>
    </div>
  );
}
