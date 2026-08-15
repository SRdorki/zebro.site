"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TeamPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("workspace_members")
        .select("id, role, created_at, profiles(name, email)")
        .eq("workspace_id", activeWorkspace.id);
      if (data) setMembers(data);
    };
    fetchMembers();
  }, [activeWorkspace, supabase]);

  const handleInvite = async () => {
    const email = prompt("Email para convite:");
    if (email && activeWorkspace) {
      await supabase.from("workspace_invites").insert({
        workspace_id: activeWorkspace.id,
        email,
        role: "Viewer"
      });
      toast.success("Convite enviado com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground mt-2">Gerencie quem tem acesso ao workspace.</p>
        </div>
        <Button onClick={handleInvite}>Convidar Membro</Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.profiles?.name || m.profiles?.email || 'Usuário Desconhecido'}</TableCell>
                <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                <TableCell>Ativo</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
