import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { user, profile: profile as Profile };
});

export async function requireOwner() {
  const { profile } = await getSession();
  if (profile.role !== "owner") {
    redirect("/pedidos");
  }
  return profile;
}

export async function requireOwnerOrManager() {
  const { profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") {
    redirect("/pedidos");
  }
  return profile;
}
