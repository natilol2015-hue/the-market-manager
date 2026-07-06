import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import { ProductForm } from "@/app/(app)/catalogo/product-form";
import { updateProduct, deleteProduct } from "@/app/actions/products";

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();

  if (!product) notFound();

  const updateAction = updateProduct.bind(null, id);
  const deleteAction = deleteProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"
          >
            Eliminar producto
          </button>
        </form>
      </div>
      <div className="max-w-lg rounded-lg border border-border bg-surface p-6">
        <ProductForm action={updateAction} defaultValues={product} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
