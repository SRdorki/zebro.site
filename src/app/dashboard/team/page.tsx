"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "@phosphor-icons/react";

export default function TeamPage() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !activeWorkspace) return;
    setIsInviting(true);
    
    // 1. Insert invite into database
    const { error } = await supabase.from("workspace_invites").insert({
      workspace_id: activeWorkspace.id,
      email: inviteEmail,
      role: inviteRole
    });

    if (error) {
      setIsInviting(false);
      toast.error("Erro ao enviar convite: " + error.message);
      return;
    }

    // 2. Get current user for the email
    const { data: { user } } = await supabase.auth.getUser();
    const inviterName = user?.user_metadata?.name || user?.email || "Alguém";

    // 3. Send the email via our new API route
    try {
      await fetch('/api/team/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          inviterName,
          workspaceName: activeWorkspace.name,
          role: inviteRole,
          inviteLink: `${window.location.origin}/invite` // Assuming there is or will be an /invite page
        })
      });
    } catch (err) {
      console.error("Erro ao disparar email", err);
      // We still consider the invite successful database-wise
    }

    setIsInviting(false);
    toast.success("Convite e e-mail enviados com sucesso!");
    setIsDialogOpen(false);
    setInviteEmail("");
    setInviteRole("Viewer");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground mt-2">Gerencie quem tem acesso ao workspace.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Convidar Membro
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Convidar para Equipe</DialogTitle>
                <DialogDescription>
                  Envie um convite por e-mail para adicionar um novo membro ao seu workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="membro@exemplo.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "Viewer")}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin (Acesso total)</SelectItem>
                      <SelectItem value="Editor">Editor (Pode alterar vídeos)</SelectItem>
                      <SelectItem value="Viewer">Visualizador (Apenas leitura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? "Enviando..." : "Enviar Convite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Cargo</TableHead>
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
