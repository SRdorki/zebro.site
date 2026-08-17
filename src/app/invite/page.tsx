import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import InviteClient from "./invite-client";

export default async function InvitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Buscar convites pendentes para o email logado
  const { data: invites } = await supabaseAdmin
    .from("workspace_invites")
    .select("*, workspaces(name)")
    .eq("email", user.email)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="Zebro Logo" className="h-12 w-auto drop-shadow-xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Convites Pendentes</h1>
          <p className="text-muted-foreground text-sm">
            Bem-vindo, <strong>{user.user_metadata?.name || user.email}</strong>.<br/> 
            Analise os convites enviados para você.
          </p>
        </div>

        <InviteClient initialInvites={invites || []} />
      </div>
    </div>
  );
}
