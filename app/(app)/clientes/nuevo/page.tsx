import { ClientForm } from "@/app/(app)/clientes/client-form";
import { createClientRecord } from "@/app/actions/clients";

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo cliente</h1>
      <div className="max-w-lg rounded-lg border border-border bg-surface p-6">
        <ClientForm action={createClientRecord} submitLabel="Crear cliente" />
      </div>
    </div>
  );
}
