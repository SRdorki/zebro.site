"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [keys, setKeys] = useState<any[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchKeys = async () => {
      const { data } = await supabase.from("api_keys").select("*").eq("workspace_id", activeWorkspace.id);
      if (data) setKeys(data);
    };
    fetchKeys();
  }, [activeWorkspace, supabase]);

  const handleGenerate = async () => {
    if (!activeWorkspace) return;
    const name = prompt("Nome da API Key:");
    if (!name) return;
    
    // Generate a secure random token
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const token = "vdr_" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash it for storage
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    navigator.clipboard.writeText(token);
    toast.success("Chave gerada e copiada para sua área de transferência!", {
      description: "Esta chave nunca mais será exibida. Guarde-a com segurança.",
      duration: 10000,
    });

    const { data } = await supabase.from("api_keys").insert({
      workspace_id: activeWorkspace.id,
      name,
      key_hash: hashHex
    }).select().single();
    
    if (data) setKeys([...keys, data]);
  };

  const handleRevoke = async (id: string) => {
    if (!activeWorkspace) return;
    
    // Optionally add a confirmation dialog here, or just revoke directly
    const confirmRevoke = window.confirm("Tem certeza que deseja revogar esta chave? Qualquer integração usando ela irá parar de funcionar imediatamente.");
    if (!confirmRevoke) return;

    const { error } = await supabase
      .from("api_keys")
      .update({ status: 'REVOKED' })
      .eq("id", id)
      .eq("workspace_id", activeWorkspace.id);

    if (error) {
      toast.error("Erro ao revogar chave.");
      return;
    }

    toast.success("Chave revogada com sucesso.");
    setKeys(keys.map(k => k.id === id ? { ...k, status: 'REVOKED' } : k));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API</h1>
          <p className="text-muted-foreground mt-2">Gere chaves para integrar com sua aplicação.</p>
        </div>
        <Button onClick={handleGenerate}>Gerar Nova API Key</Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left border-b">
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-b">
                <td className="p-4 font-medium">{k.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${k.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {k.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {k.status === 'ACTIVE' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRevoke(k.id)}
                    >
                      Revogar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
