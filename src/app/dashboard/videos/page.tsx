import { VideoList } from "@/components/videos/video-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function VideosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vídeos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os vídeos do seu workspace.
          </p>
        </div>
        <Link href="/dashboard/upload" className={buttonVariants({ variant: "default" })}>
          <Plus className="h-4 w-4 mr-2" />
          Upload
        </Link>
      </div>
      
      <VideoList />
    </div>
  );
}
