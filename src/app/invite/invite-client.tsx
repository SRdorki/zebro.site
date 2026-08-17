"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptInvite, declineInvite } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight } from "lucide-react";

export default function InviteClient({ initialInvites }: { initialInvites: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (initialInvites.length === 0) {
    return (
      <Card className="border-white/10 shadow-xl bg-card/60 backdrop-blur-xl">
        <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
          Nenhum convite pendente encontrado para o seu e-mail no momento.
        </CardContent>
        <CardFooter>
          <Button variant="default" className="w-full" onClick={() => router.push("/dashboard")}>
            Ir para o Dashboard
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleAccept = async (id: string) => {
    setLoadingId(id);
    try {
      await acceptInvite(id);
      toast.success("Convite aceito com sucesso!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
      setLoadingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setLoadingId(id);
    try {
      await declineInvite(id);
      toast.success("Convite recusado.");
      setLoadingId(null);
    } catch (err: any) {
      toast.error(err.message);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {initialInvites.map(invite => (
        <Card key={invite.id} className="border-white/10 shadow-xl bg-card/60 backdrop-blur-xl transition-all hover:border-primary/50">
          <CardHeader>
            <CardTitle>Convite para colaborar</CardTitle>
            <CardDescription>
              Você foi convidado(a) para participar do workspace <strong className="text-foreground">{invite.workspaces?.name}</strong> com a permissão de <strong className="text-foreground">{invite.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-3">
            <Button 
              variant="default" 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
              disabled={loadingId !== null}
              onClick={() => handleAccept(invite.id)}
            >
              <Check className="w-4 h-4 mr-2" />
              Aceitar Convite
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-destructive hover:text-destructive border-white/10 hover:bg-destructive/10" 
              disabled={loadingId !== null}
              onClick={() => handleDecline(invite.id)}
            >
              <X className="w-4 h-4 mr-2" />
              Recusar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
