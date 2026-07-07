import { requireOwnerOrManager } from "@/lib/dal";
import { ProductForm } from "@/app/(app)/catalogo/product-form";
import { createProduct } from "@/app/actions/products";

export default async function NuevoProductoPage() {
  await requireOwnerOrManager();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <div className="max-w-lg rounded-lg border border-border bg-surface p-6">
        <ProductForm action={createProduct} submitLabel="Crear producto" />
      </div>
    </div>
  );
}
