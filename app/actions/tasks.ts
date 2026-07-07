"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/dal";
import type { TaskStatus } from "@/lib/supabase/types";

export async function createTask(_prevState: unknown, formData: FormData) {
  const { user, profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") {
    return { error: "No tenés permiso para crear tareas." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const assigned_to = String(formData.get("assigned_to") ?? "") || null;
  const due_date = String(formData.get("due_date") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) {
    return { error: "El título es obligatorio." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    assigned_to,
    due_date,
    notes,
    created_by: user.id,
  });

  if (error) {
    return { error: "No se pudo crear la tarea." };
  }

  revalidatePath("/pedidos");
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  await getSession();
  const supabase = await createSupabaseClient();
  await supabase.from("tasks").update({ status }).eq("id", id);
  revalidatePath("/pedidos");
}

export async function deleteTask(id: string) {
  const { profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") return;

  const supabase = await createSupabaseClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/pedidos");
}
