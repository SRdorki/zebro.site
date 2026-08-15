import { createClient } from "@supabase/supabase-js";
import { ZebroPlayer } from "@/components/player/zebro-player";

export const revalidate = 0;

export default async function EmbedVideoPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !video || video.privacy === "PRIVATE") {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white p-4">
        <p className="text-sm text-white/50">Vídeo indisponível.</p>
      </div>
    );
  }

  // Parse embed settings from search params
  const isAutoplay = resolvedSearchParams.autoplay === '1';
  const isMuted = resolvedSearchParams.muted === '1';
  const isLoop = resolvedSearchParams.loop === '1';
  const allowSeek = resolvedSearchParams.seek !== '0'; // default true, only false if seek=0

  return (
    <div className="w-full h-[100vh] bg-black m-0 p-0 overflow-hidden">
      <ZebroPlayer 
        videoPath={video.file_path} 
        videoId={video.id}
        workspaceId={video.workspace_id}
        autoplay={isAutoplay}
        muted={isMuted}
        loop={isLoop}
        allowSeek={allowSeek}
      />
    </div>
  );
}
