import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";

export default async function CatalogoPage() {
  await requireOwner();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Catálogo</h1>
        <Link
          href="/catalogo/nuevo"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Categoría</th>
              <th className="px-4 py-2 font-medium">Precio</th>
              <th className="px-4 py-2 font-medium">Stock</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <Link href={`/catalogo/${p.id}`} className="font-medium hover:text-accent">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">{p.category ?? "—"}</td>
                <td className="px-4 py-2">${p.price.toFixed(2)}</td>
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active ? "bg-accent/15 text-accent" : "bg-foreground/10 text-muted"
                    }`}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Todavía no hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
