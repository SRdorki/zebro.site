"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Plus, DotsThreeVertical as MoreVertical, Folders as FolderGit2 } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
};

export function ProjectList() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchProjects = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (data) setProjects(data as Project[]);
      setLoading(false);
    };

    fetchProjects();
  }, [activeWorkspace, supabase]);

  const handleCreate = async () => {
    if (!activeWorkspace) return;
    const name = prompt("Nome do Projeto:");
    if (!name) return;

    const { data, error } = await supabase.from("projects").insert({
      workspace_id: activeWorkspace.id,
      name,
      slug: name.toLowerCase().replace(/ /g, "-") + "-" + Date.now(),
    }).select().single();

    if (data && !error) {
      setProjects([data as Project, ...projects]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir projeto?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-2">Agrupe e organize seus vídeos em projetos.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card">
          <FolderGit2 className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mt-1">Crie seu primeiro projeto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="border rounded-xl p-6 bg-card flex flex-col group">
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{project.slug}</p>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(project.created_at), "dd MMM, yyyy", { locale: ptBR })}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)} className="text-destructive">
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
