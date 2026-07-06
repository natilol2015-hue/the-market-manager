"use client";

import { useActionState } from "react";
import type { Client } from "@/lib/supabase/types";

type FormAction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ error: string } | undefined>;

export function ClientForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: {
  action: FormAction;
  defaultValues?: Partial<Client>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono / WhatsApp" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        <Field label="Email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
      </div>
      <Field label="Dirección" name="address" defaultValue={defaultValues?.address ?? ""} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
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

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
