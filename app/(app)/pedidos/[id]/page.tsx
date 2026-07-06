import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import { OrderForm } from "@/app/(app)/pedidos/order-form";
import { updateOrder, deleteOrder } from "@/app/actions/orders";

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getSession();
  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: clients }, { data: products }] =
    await Promise.all([
      supabase.from("orders").select("*").eq("id", id).single(),
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("clients").select("*").order("name"),
      supabase.from("products").select("*").eq("active", true).order("name"),
    ]);

  if (!order) notFound();

  const updateAction = updateOrder.bind(null, id);
  const deleteAction = deleteOrder.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Pedido del {new Date(order.created_at).toLocaleDateString("es-AR")}
        </h1>
        {profile.role === "owner" && (
          <form action={deleteAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Eliminar pedido
            </button>
          </form>
        )}
      </div>

      <div className="max-w-3xl rounded-lg border border-border bg-surface p-6">
        <OrderForm
          action={updateAction}
          clients={clients ?? []}
          products={products ?? []}
          defaultValues={{
            client_id: order.client_id,
            origin: order.origin,
            status: order.status,
            notes: order.notes,
            items: (items ?? []).map((i) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              size: i.size,
              color: i.color,
            })),
          }}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
