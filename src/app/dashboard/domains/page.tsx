"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";

export default function DomainsPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchDomains = async () => {
      const { data } = await supabase.from("domains").select("*").eq("workspace_id", activeWorkspace.id);
      if (data) setDomains(data);
    };
    fetchDomains();
  }, [activeWorkspace, supabase]);

  const handleAddDomain = async () => {
    if (!activeWorkspace) return;
    const domain = prompt("Adicione seu domínio customizado (ex: videos.empresa.com):");
    if (!domain) return;
    const { data } = await supabase.from("domains").insert({
      workspace_id: activeWorkspace.id,
      domain
    }).select().single();
    
    if (data) setDomains([...domains, data]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domínios Customizados</h1>
          <p className="text-muted-foreground mt-2">Utilize a Zebro no seu próprio domínio.</p>
        </div>
        <Button onClick={handleAddDomain}>Adicionar Domínio</Button>
      </div>

      <div className="grid gap-4">
        {domains.map(d => (
          <div key={d.id} className="p-4 border rounded-xl bg-card flex justify-between items-center">
            <div>
              <p className="font-semibold">{d.domain}</p>
              <p className="text-sm text-muted-foreground">Configuração CNAME pendente</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Verificar DNS</Button>
              <Button variant="ghost" size="sm" className="text-destructive">Remover</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

