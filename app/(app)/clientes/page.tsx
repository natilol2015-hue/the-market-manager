import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

export default async function ClientesPage() {
  await getSession();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
        >
          + Nuevo cliente
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Teléfono</th>
              <th className="px-4 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <Link href={`/clientes/${c.id}`} className="font-medium hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">{c.phone ?? "—"}</td>
                <td className="px-4 py-2 text-muted">{c.email ?? "—"}</td>
              </tr>
            ))}
            {!clients?.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  Todavía no hay clientes cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
