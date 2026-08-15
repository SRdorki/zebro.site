import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkspaceProvider, Workspace } from "@/components/providers/workspace-provider";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch workspaces for this user
  const { data: workspaceMembers, error: wmError } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(id, name, slug, logo_url)")
    .eq("user_id", user.id);

  if (wmError) {
    console.error("Workspace Members Error:", wmError);
  }

  const workspaces = (workspaceMembers || []).map((wm) => wm.workspace as unknown as Workspace);

  const cookieStore = await cookies();
  const savedWorkspaceId = cookieStore.get("zebro-workspace")?.value;

  const initialActiveWorkspace = workspaces.find((w) => w.id === savedWorkspaceId) || workspaces[0] || null;

  return (
    <WorkspaceProvider initialWorkspaces={workspaces} initialActiveWorkspace={initialActiveWorkspace}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto p-6 md:p-10 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

