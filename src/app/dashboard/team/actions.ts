"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars");
  }
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function checkAdmin(workspaceId: string) {
  const supabase = await createServerClient();
  const supabaseAdmin = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado.");
  }

  // Check if current user is admin of the workspace
  const { data: member } = await supabaseAdmin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "Admin") {
    throw new Error("Apenas administradores podem remover membros.");
  }

  return user;
}

export async function removeMember(memberId: string, workspaceId: string) {
  const user = await checkAdmin(workspaceId);
  const supabaseAdmin = getAdminClient();

  // Get the member to be removed
  const { data: targetMember } = await supabaseAdmin
    .from("workspace_members")
    .select("user_id")
    .eq("id", memberId)
    .single();

  if (!targetMember) throw new Error("Membro não encontrado.");

  // Prevent admin from removing themselves here (optional safety)
  if (targetMember.user_id === user.id) {
    throw new Error("Você não pode remover a si mesmo por aqui.");
  }

  const { error } = await supabaseAdmin
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw new Error("Erro ao remover membro.");
  }

  return { success: true };
}

export async function cancelInvite(inviteId: string, workspaceId: string) {
  await checkAdmin(workspaceId);
  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId);

  if (error) {
    throw new Error("Erro ao cancelar convite.");
  }

  return { success: true };
}
