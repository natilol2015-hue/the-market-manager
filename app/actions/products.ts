"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { requireOwnerOrManager } from "@/lib/dal";

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function readProductFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    price: Number(formData.get("price")) || 0,
    sizes: splitList(formData.get("sizes")),
    colors: splitList(formData.get("colors")),
    stock: Number(formData.get("stock")) || 0,
    active: formData.get("active") === "on",
  };
}

export async function createProduct(_prevState: unknown, formData: FormData) {
  await requireOwnerOrManager();
  const fields = readProductFields(formData);

  if (!fields.name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("products").insert(fields);

  if (error) {
    return { error: "No se pudo guardar el producto." };
  }

  revalidatePath("/catalogo");
  redirect("/catalogo");
}

export async function updateProduct(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  await requireOwnerOrManager();
  const fields = readProductFields(formData);

  if (!fields.name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("products").update(fields).eq("id", id);

  if (error) {
    return { error: "No se pudo actualizar el producto." };
  }

  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${id}`);
  redirect("/catalogo");
}

export async function deleteProduct(id: string) {
  await requireOwnerOrManager();
  const supabase = await createSupabaseClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/catalogo");
  redirect("/catalogo");
}
