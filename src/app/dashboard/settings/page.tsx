"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const handleSave = async () => {
    if (!activeWorkspace) return;
    await supabase.from("workspaces").update({ name }).eq("id", activeWorkspace.id);
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Ajuste as preferências do seu Workspace.</p>
      </div>

      <div className="space-y-6 border p-6 rounded-xl bg-card">
        <h2 className="text-xl font-semibold border-b pb-2">Geral</h2>
        
        <div className="space-y-2">
          <Label>Nome do Workspace</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>

        <Button onClick={handleSave}>Salvar Alterações</Button>
      </div>

      <div className="space-y-6 border border-destructive/20 p-6 rounded-xl bg-destructive/5">
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Ações irreversíveis relacionadas ao seu workspace.</p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-destructive">Excluir Workspace</p>
            <p className="text-sm text-muted-foreground">Todos os vídeos, playlists e dados serão apagados.</p>
          </div>
          <Button variant="destructive">Excluir</Button>
        </div>
      </div>
    </div>
  );
}
