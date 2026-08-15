import { createClient } from "@supabase/supabase-js";
import { ZebroPlayer } from "@/components/player/zebro-player";
import { notFound } from "next/navigation";
import { PlaySquare } from "lucide-react";
import { AdBanner } from "@/components/ad-banner";

export const revalidate = 0;

export default async function PublicVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Inicializamos o cliente com as chaves públicas (anônimas)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // A busca abaixo vai funcionar assim que o usuário rodar a política RLS
  const { data: video, error } = await supabase
    .from("videos")
    .select(`
      *,
      workspaces (
        plan
      )
    `)
    .eq("id", id)
    .single();

  if (error || !video || video.privacy === "PRIVATE") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <PlaySquare className="h-8 w-8 text-white/50" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Vídeo não encontrado ou privado</h1>
          <p className="text-white/60">
            Este vídeo não existe, foi apagado pelo criador ou está configurado como privado.
          </p>
        </div>
      </div>
    );
  }

  // Fallback to 'free' if no plan is found (just in case)
  const workspacePlan = video.workspaces?.plan || 'free';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">
      {/* Header Minimalista */}
      <header className="p-6 md:px-12 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Zebro" className="h-8 w-auto" />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 md:px-12 py-12 space-y-10">
        {/* Player Container */}
        <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video">
          <ZebroPlayer 
            videoPath={video.file_path} 
            videoId={video.id}
            workspaceId={video.workspace_id}
          />
        </div>

        {workspacePlan === 'free' && <AdBanner />}

        {/* Detalhes do Vídeo */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {video.title || "Vídeo sem título"}
          </h1>
          {video.description && (
            <p className="text-lg text-white/70 whitespace-pre-wrap leading-relaxed">
              {video.description}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
