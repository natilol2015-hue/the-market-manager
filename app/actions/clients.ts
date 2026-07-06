"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";

function readClientFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClientRecord(_prevState: unknown, formData: FormData) {
  const { user } = await getSession();
  const fields = readClientFields(formData);

  if (!fields.name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .insert({ ...fields, created_by: user.id });

  if (error) {
    return { error: "No se pudo guardar el cliente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClientRecord(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  await getSession();
  const fields = readClientFields(formData);

  if (!fields.name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("clients").update(fields).eq("id", id);

  if (error) {
    return { error: "No se pudo actualizar el cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect("/clientes");
}

export async function deleteClientRecord(id: string) {
  const { profile } = await getSession();
  if (profile.role !== "owner") return;

  const supabase = await createSupabaseClient();
  await supabase.from("clients").delete().eq("id", id);

  revalidatePath("/clientes");
  redirect("/clientes");
}
