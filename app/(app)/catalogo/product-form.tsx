"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/supabase/types";

type FormAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ error: string } | undefined>;

export function ProductForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: {
  action: FormAction;
  defaultValues?: Partial<Product>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Categoría
          </label>
          <input
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="text-sm font-medium">
            Precio
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.price ?? 0}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock" className="text-sm font-medium">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={defaultValues?.stock ?? 0}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sizes" className="text-sm font-medium">
            Talles (separados por coma)
          </label>
          <input
            id="sizes"
            name="sizes"
            placeholder="S, M, L"
            defaultValue={defaultValues?.sizes?.join(", ") ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="colors" className="text-sm font-medium">
            Colores (separados por coma)
          </label>
          <input
            id="colors"
            name="colors"
            placeholder="Negro, Blanco"
            defaultValue={defaultValues?.colors?.join(", ") ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-border"
        />
        Activo (visible para armar pedidos)
      </label>

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
