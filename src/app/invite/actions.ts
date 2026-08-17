"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function acceptInvite(inviteId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("Não autorizado");
  }

  // 1. Fetch the invite
  const { data: invite, error: fetchError } = await supabaseAdmin
    .from("workspace_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("status", "PENDING")
    .single();

  if (fetchError || !invite) {
    throw new Error("Convite não encontrado ou já processado");
  }

  if (invite.email !== user.email) {
    throw new Error("Este convite foi enviado para um e-mail diferente do logado atualmente");
  }

  // 2. Insert into workspace_members
  const { error: insertError } = await supabaseAdmin
    .from("workspace_members")
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role
    });

  if (insertError) {
    // se o erro for duplicado, só seguir
    if (!insertError.message.includes("duplicate key")) {
      throw new Error("Erro ao adicionar você no workspace: " + insertError.message);
    }
  }

  // 3. Update invite status
  await supabaseAdmin
    .from("workspace_invites")
    .update({ status: "ACCEPTED" })
    .eq("id", inviteId);

  revalidatePath("/dashboard");
  revalidatePath("/invite");
  return { success: true };
}

export async function declineInvite(inviteId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("Não autorizado");
  }

  const { data: invite } = await supabaseAdmin
    .from("workspace_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("status", "PENDING")
    .single();

  if (!invite || invite.email !== user.email) {
    throw new Error("Convite inválido");
  }

  await supabaseAdmin
    .from("workspace_invites")
    .update({ status: "CANCELLED" })
    .eq("id", inviteId);

  revalidatePath("/invite");
  return { success: true };
}
