"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, LayoutGrid, List, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Video = {
  id: string;
  title: string;
  status: string;
  privacy: string;
  size_bytes: number;
  created_at: string;
  thumbnail_url: string | null;
};

export function VideoList() {
  const { activeWorkspace } = useWorkspace();
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchVideos = async () => {
      setLoading(true);
      let query = supabase
        .from("videos")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        const vids = data as Video[];
        setVideos(vids);
        
        // Fetch signed URLs for thumbnails in bulk
        const thumbnailPaths = vids
          .filter(v => v.thumbnail_url)
          .map(v => v.thumbnail_url as string);
          
        if (thumbnailPaths.length > 0) {
          const { data: signedUrlsData } = await supabase.storage
            .from("videos_bucket")
            .createSignedUrls(thumbnailPaths, 60 * 60);
            
          if (signedUrlsData) {
            const thumbMap: Record<string, string> = {};
            vids.forEach(v => {
              if (v.thumbnail_url) {
                const matched = signedUrlsData.find(su => su.path === v.thumbnail_url);
                if (matched && matched.signedUrl) {
                  thumbMap[v.id] = matched.signedUrl;
                }
              }
            });
            setThumbnails(thumbMap);
          }
        }
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      fetchVideos();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeWorkspace, search, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
    
    await supabase.from("videos").delete().eq("id", id);
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vídeos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 border rounded-md p-1 bg-card">
          <button 
            className={`p-1.5 rounded ${view === 'list' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </button>
          <button 
            className={`p-1.5 rounded ${view === 'grid' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card">
          <h3 className="text-lg font-semibold">Nenhum vídeo encontrado</h3>
          <p className="text-muted-foreground mt-1">
            Faça upload do seu primeiro vídeo ou mude a busca.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vídeo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Privacidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/videos/${video.id}`} className="hover:underline">
                      {video.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={video.status === 'READY' ? 'default' : 'secondary'}>
                      {video.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{video.privacy}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(video.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-full outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href={`/dashboard/videos/${video.id}`} className="w-full">Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(video.id)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border rounded-lg bg-card overflow-hidden flex flex-col group">
              <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                {thumbnails[video.id] ? (
                  <img src={thumbnails[video.id]} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem Thumbnail</span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/dashboard/videos/${video.id}`} className="font-semibold line-clamp-1 group-hover:underline">
                  {video.title}
                </Link>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant={video.status === 'READY' ? 'default' : 'secondary'}>{video.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 hover:bg-muted rounded outline-none">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Link href={`/dashboard/videos/${video.id}`} className="w-full">Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(video.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
