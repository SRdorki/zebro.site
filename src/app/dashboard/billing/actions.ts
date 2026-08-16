"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function selectFreePlan(workspaceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Ensure user has access to this workspace
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!member || (member.role !== "Owner" && member.role !== "Admin")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ plan: "free" })
    .eq("id", workspaceId);

  if (error) {
    throw new Error("Failed to update plan");
  }

  revalidatePath("/dashboard", "layout");
}
