import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import { ClientForm } from "@/app/(app)/clientes/client-form";
import { updateClientRecord, deleteClientRecord } from "@/app/actions/clients";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await getSession();
  const supabase = await createClient();

  const [{ data: client }, { data: orders }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const updateAction = updateClientRecord.bind(null, id);
  const deleteAction = deleteClientRecord.bind(null, id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{client.name}</h1>
        {profile.role === "owner" && (
          <form action={deleteAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Eliminar cliente
            </button>
          </form>
        )}
      </div>

      <div className="max-w-lg rounded-lg border border-border bg-surface p-6">
        <ClientForm action={updateAction} defaultValues={client} submitLabel="Guardar cambios" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Pedidos de este cliente</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
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
                  <td className="px-4 py-2 capitalize">{o.origin}</td>
                  <td className="px-4 py-2 capitalize">{o.status}</td>
                  <td className="px-4 py-2">${o.total.toFixed(2)}</td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Sin pedidos todavía.
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
