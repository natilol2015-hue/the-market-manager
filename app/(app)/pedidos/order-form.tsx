"use client";

import { useActionState, useMemo, useState } from "react";
import type { Client, OrderOrigin, OrderStatus, Product } from "@/lib/supabase/types";

type FormAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ error: string } | undefined>;

interface LineItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
}

export function OrderForm({
  action,
  clients,
  products,
  defaultValues,
  submitLabel = "Crear pedido",
}: {
  action: FormAction;
  clients: Client[];
  products: Product[];
  defaultValues?: {
    client_id?: string | null;
    origin?: OrderOrigin;
    status?: OrderStatus;
    notes?: string | null;
    items?: LineItem[];
  };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [items, setItems] = useState<LineItem[]>(defaultValues?.items ?? []);
  const [selectedProductId, setSelectedProductId] = useState("");

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    [items]
  );

  function addProduct() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        size: null,
        color: null,
      },
    ]);
    setSelectedProductId("");
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="client_id">
            Cliente
          </label>
          <select
            id="client_id"
            name="client_id"
            defaultValue={defaultValues?.client_id ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Sin cliente asignado</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="origin">
            Origen del pedido
          </label>
          <select
            id="origin"
            name="origin"
            required
            defaultValue={defaultValues?.origin ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="" disabled>
              Elegí origen
            </option>
            <option value="online">Online (página)</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "pendiente"}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="notes">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Productos</label>
        <div className="flex gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Elegí un producto para agregar</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.price.toFixed(2)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addProduct}
            disabled={!selectedProductId}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-background disabled:opacity-50"
          >
            Agregar
          </button>
        </div>

        {items.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium">Talle</th>
                  <th className="px-3 py-2 font-medium">Color</th>
                  <th className="px-3 py-2 font-medium">Cant.</th>
                  <th className="px-3 py-2 font-medium">Precio</th>
                  <th className="px-3 py-2 font-medium">Subtotal</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="px-3 py-2">{item.product_name}</td>
                    <td className="px-3 py-2">
                      <input
                        value={item.size ?? ""}
                        onChange={(e) => updateItem(index, { size: e.target.value || null })}
                        className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.color ?? ""}
                        onChange={(e) => updateItem(index, { color: e.target.value || null })}
                        className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, { quantity: Number(e.target.value) || 1 })
                        }
                        className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, { unit_price: Number(e.target.value) || 0 })
                        }
                        className="w-24 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-danger hover:underline"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-right text-sm font-semibold">Total: ${total.toFixed(2)}</p>
      </div>

      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
