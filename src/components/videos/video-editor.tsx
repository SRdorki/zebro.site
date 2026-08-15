"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ZebroPlayer } from "@/components/player/zebro-player";
import { Switch } from "@/components/ui/switch";
import { Copy, Link as LinkIcon, Code, Eye, Lock, Globe, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function VideoEditor({ video }: { video: any }) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: video.title || "",
    description: video.description || "",
    privacy: video.privacy || "PRIVATE",
  });

  const [embedSettings, setEmbedSettings] = useState({
    responsive: true,
    autoplay: false,
    muted: false,
    loop: false,
    allowEmbed: true,
    allowSeek: true,
  });

  const supabase = createClient();
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("videos")
      .update({
        title: formData.title,
        description: formData.description,
        privacy: formData.privacy,
      })
      .eq("id", video.id);

    setLoading(false);
    if (!error) {
      toast.success("Vídeo atualizado com sucesso!");
      router.refresh();
    } else {
      toast.error("Erro ao salvar o vídeo.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    // Remove from storage first (optional, but good practice. For now we just delete from db and let trigger/cron clean up, or do it here)
    if (video.file_path) {
      await supabase.storage.from("videos_bucket").remove([video.file_path]);
    }
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    
    if (!error) {
      toast.success("Vídeo excluído com sucesso!");
      router.push("/dashboard");
    } else {
      toast.error("Erro ao excluir vídeo.");
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getBaseUrl = () => {
    if (mounted && typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://zebro.site"; // fallback para SSR
  };

  const generateIframeCode = () => {
    let params = [];
    if (embedSettings.autoplay) params.push("autoplay=1");
    if (embedSettings.muted) params.push("muted=1");
    if (embedSettings.loop) params.push("loop=1");
    if (!embedSettings.allowSeek) params.push("seek=0");
    
    const queryStr = params.length > 0 ? `?${params.join("&")}` : "";
    const src = `${getBaseUrl()}/embed/${video.id}${queryStr}`;
    
    if (embedSettings.responsive) {
      return `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="${formData.title}"></iframe></div>`;
    } else {
      return `<iframe src="${src}" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" title="${formData.title}"></iframe>`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      
      {/* Coluna Esquerda: Player + Detalhes */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Player Grande */}
        <div className="w-full bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-border">
          {video.file_path ? (
            <ZebroPlayer 
              videoPath={video.file_path} 
              videoId={video.id}
              workspaceId={video.workspace_id}
            />
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center bg-muted">
              <p className="text-muted-foreground">Vídeo não processado ainda.</p>
            </div>
          )}
        </div>

        {/* Formulário de Detalhes do Vídeo */}
        <div className="bg-card border rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Detalhes do vídeo</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure o título e descrição que aparecerão no player.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">Título</Label>
              <Input 
                id="title" 
                className="text-lg py-6 bg-muted/50 focus:bg-background"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold">Descrição</Label>
              <textarea 
                id="description" 
                className="flex min-h-[140px] w-full rounded-md border border-input bg-muted/50 focus:bg-background px-3 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Adicione uma descrição detalhada para o seu vídeo..."
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="lg" className="px-6 gap-2" />}>
                <Trash2 className="h-4 w-4" />
                Excluir Vídeo
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Você tem certeza absoluta?</DialogTitle>
                  <DialogDescription>
                    Esta ação não pode ser desfeita. Isto irá deletar permanentemente o vídeo
                    e remover seus dados dos nossos servidores.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <DialogClose render={<Button variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Excluindo..." : "Sim, Excluir Vídeo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button size="lg" onClick={handleSave} disabled={loading} className="px-8">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Compartilhamento e Embed */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Painel de Compartilhamento */}
        <div className="bg-card border rounded-2xl shadow-sm sticky top-6 overflow-hidden">
          <div className="border-b px-6 py-4 bg-muted/20 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Compartilhar</h2>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Privacidade */}
            <div className="space-y-3">
              <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Visibilidade</Label>
              <Select 
                value={formData.privacy} 
                onValueChange={(val) => {
                  setFormData({ ...formData, privacy: val });
                  // Poderíamos ter auto-save aqui!
                }}
              >
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder="Privacidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Público</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UNLISTED">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Não Listado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Privado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Incorporável */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Incorporável</Label>
                <p className="text-xs text-muted-foreground">Permitir embed em outros sites</p>
              </div>
              <Switch 
                checked={embedSettings.allowEmbed} 
                onCheckedChange={(c) => setEmbedSettings(s => ({ ...s, allowEmbed: c }))} 
              />
            </div>

            <hr className="border-border" />

            {/* Configurações de Reprodução */}
            <div className="space-y-4">
              <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Reprodução do iFrame</Label>
              
              <div className="flex items-center justify-between">
                <Label className="font-medium cursor-pointer" onClick={() => setEmbedSettings(s => ({ ...s, autoplay: !s.autoplay }))}>Reprodução Automática</Label>
                <Switch checked={embedSettings.autoplay} onCheckedChange={(c) => setEmbedSettings(s => ({ ...s, autoplay: c }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="font-medium cursor-pointer" onClick={() => setEmbedSettings(s => ({ ...s, muted: !s.muted }))}>Iniciar Mudo</Label>
                <Switch checked={embedSettings.muted} onCheckedChange={(c) => setEmbedSettings(s => ({ ...s, muted: c }))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-medium cursor-pointer" onClick={() => setEmbedSettings(s => ({ ...s, loop: !s.loop }))}>Loop (Repetir ao fim)</Label>
                <Switch checked={embedSettings.loop} onCheckedChange={(c) => setEmbedSettings(s => ({ ...s, loop: c }))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-medium cursor-pointer" onClick={() => setEmbedSettings(s => ({ ...s, allowSeek: !s.allowSeek }))}>Permitir Avançar/Voltar</Label>
                <Switch checked={embedSettings.allowSeek} onCheckedChange={(c) => setEmbedSettings(s => ({ ...s, allowSeek: c }))} />
              </div>
            </div>

            <hr className="border-border" />

            {/* Geração de Links */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Link Público</Label>
                <div className="flex">
                  <Input readOnly value={`${getBaseUrl()}/v/${video.id}`} className="rounded-r-none bg-muted/50 border-r-0" />
                  <Button variant="secondary" className="rounded-l-none border border-l-0" onClick={() => copyToClipboard(`${getBaseUrl()}/v/${video.id}`)}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Código Embed</Label>
                <textarea 
                  readOnly 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none"
                  value={generateIframeCode()}
                />
                <Button className="w-full mt-2 gap-2" variant="default" onClick={() => copyToClipboard(generateIframeCode())}>
                  <Code className="h-4 w-4" />
                  Copiar Código HTML
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

