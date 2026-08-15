import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VideoEditor } from "@/components/videos/video-editor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  // Access params securely in Next 15+
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (!video) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/videos" className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Vídeo</h1>
          <p className="text-muted-foreground mt-1">
            Configure os detalhes e privacidade do seu vídeo.
          </p>
        </div>
      </div>
      
      <VideoEditor video={video} />
    </div>
  );
}
