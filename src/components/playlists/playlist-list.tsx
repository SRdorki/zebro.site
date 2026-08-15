"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Plus, ListVideo } from "lucide-react";

type Playlist = {
  id: string;
  name: string;
  privacy: string;
};

export function PlaylistList() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchPlaylists = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (data) setPlaylists(data as Playlist[]);
      setLoading(false);
    };

    fetchPlaylists();
  }, [activeWorkspace, supabase]);

  const handleCreate = async () => {
    if (!activeWorkspace) return;
    const name = prompt("Nome da Playlist:");
    if (!name) return;

    const { data, error } = await supabase.from("playlists").insert({
      workspace_id: activeWorkspace.id,
      name,
    }).select().single();

    if (data && !error) {
      setPlaylists([data as Playlist, ...playlists]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir playlist?")) return;
    await supabase.from("playlists").delete().eq("id", id);
    setPlaylists(playlists.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
          <p className="text-muted-foreground mt-2">Organize seus vídeos em sequências.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Playlist
        </Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card">
          <ListVideo className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma playlist</h3>
          <p className="text-muted-foreground mt-1">Crie sua primeira playlist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(p => (
            <div key={p.id} className="border rounded-xl p-6 bg-card flex flex-col group">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{p.privacy}</p>
              <div className="flex-1" />
              <div className="flex items-center justify-end mt-6 pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive">
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
