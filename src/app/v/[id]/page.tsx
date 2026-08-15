import { createClient } from "@supabase/supabase-js";
import { ZebroPlayer } from "@/components/player/zebro-player";
import { notFound } from "next/navigation";
import { PlaySquare } from "lucide-react";

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

        {/* Mock de Anúncio Google Adsense (Fora do Player) */}
        {workspacePlan === 'free' && (
          <div className="w-full max-w-4xl mx-auto bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patrocinado</span>
              <span className="text-xs text-blue-500 font-semibold hover:underline cursor-pointer">Ads by Google</span>
            </div>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center shrink-0">
                <span className="text-blue-400 font-bold text-xl sm:text-2xl">LOGO</span>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">OFERTA IMPERDÍVEL! Domínio grátis por 1 ano.</h3>
                <p className="text-gray-600 text-sm">Hospede seu site com velocidade, segurança e suporte 24h. Aproveite a promoção por tempo limitado.</p>
              </div>
              <button className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap">
                Saiba Mais
              </button>
            </div>
          </div>
        )}

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
