"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { OrderOrigin, OrderStatus } from "@/lib/supabase/types";

interface ItemInput {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
}

function parseItems(formData: FormData): ItemInput[] {
  const raw = String(formData.get("items_json") ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && i.product_name && Number(i.quantity) > 0)
      .map((i) => ({
        product_id: i.product_id ?? null,
        product_name: String(i.product_name),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price) || 0,
        size: i.size || null,
        color: i.color || null,
      }));
  } catch {
    return [];
  }
}

function readOrderFields(formData: FormData) {
  const origin = String(formData.get("origin") ?? "");
  const status = String(formData.get("status") ?? "pendiente");
  const client_id = String(formData.get("client_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  return {
    origin: origin as OrderOrigin,
    status: status as OrderStatus,
    client_id,
    notes,
  };
}

export async function createOrder(_prevState: unknown, formData: FormData) {
  const { user } = await getSession();
  const fields = readOrderFields(formData);
  const items = parseItems(formData);

  if (fields.origin !== "online" && fields.origin !== "whatsapp") {
    return { error: "Elegí el origen del pedido." };
  }
  if (!items.length) {
    return { error: "Agregá al menos un producto." };
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const supabase = await createSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({ ...fields, total, created_by: user.id })
    .select("id")
    .single();

  if (error || !order) {
    return { error: "No se pudo crear el pedido." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return { error: "El pedido se creó pero hubo un error guardando los productos." };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function updateOrder(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  await getSession();
  const fields = readOrderFields(formData);
  const items = parseItems(formData);

  if (fields.origin !== "online" && fields.origin !== "whatsapp") {
    return { error: "Elegí el origen del pedido." };
  }
  if (!items.length) {
    return { error: "Agregá al menos un producto." };
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ ...fields, total })
    .eq("id", id);

  if (error) {
    return { error: "No se pudo actualizar el pedido." };
  }

  await supabase.from("order_items").delete().eq("order_id", id);
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: id })));

  if (itemsError) {
    return { error: "No se pudieron guardar los productos del pedido." };
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
  redirect(`/pedidos/${id}`);
}

export async function deleteOrder(id: string) {
  const { profile } = await getSession();
  if (profile.role !== "owner") return;

  const supabase = await createSupabaseClient();
  await supabase.from("orders").delete().eq("id", id);

  revalidatePath("/pedidos");
  redirect("/pedidos");
}
