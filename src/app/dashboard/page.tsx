import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Video } from "lucide-react";
import { ViewsChart } from "@/components/dashboard/views-chart";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get("zebro-workspace")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let totalVideos = 0;
  let totalStorageBytes = 0;
  let totalViews = 0;
  let recentVideos: any[] = [];
  let chartData: { date: string; views: number }[] = [];

  if (workspaceId) {
    // 1. Fetch total videos and storage used
    const { data: videosData } = await supabase
      .from("videos")
      .select("size_bytes")
      .eq("workspace_id", workspaceId);

    if (videosData) {
      totalVideos = videosData.length;
      totalStorageBytes = videosData.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
    }

    // 2. Fetch total views
    const { data: viewsData } = await supabase
      .from("daily_video_stats")
      .select("date, views")
      .eq("workspace_id", workspaceId);

    if (viewsData) {
      totalViews = viewsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
      
      const grouped = viewsData.reduce((acc, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + curr.views;
        return acc;
      }, {} as Record<string, number>);
      
      chartData = Object.keys(grouped).sort().map(date => ({
        date,
        views: grouped[date]
      }));
    }

    // 3. Fetch recent videos (Top 5)
    const { data: recent } = await supabase
      .from("videos")
      .select("id, title, created_at, size_bytes")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recent) {
      recentVideos = recent;
    }
  }

  // Estimativa simples de Bandwidth: Views * (Média de 15MB por view)
  // Como é apenas uma demonstração visual, usaremos essa estimativa, a menos que o vídeo seja reproduzido inteiro,
  // na vida real dependeria dos chunks carregados (HLS).
  const estimatedBandwidthBytes = totalViews * 15 * 1024 * 1024; 

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vídeos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armazenamento Usado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStorageBytes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Largura de Banda (Est.)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{formatBytes(estimatedBandwidthBytes)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visualizações (Geral)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-0">
            <ViewsChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>Vídeos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground space-y-4">
                <p>Você ainda não possui vídeos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <Link href={`/dashboard/videos/${video.id}`} key={video.id} className="flex items-center gap-4 hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {formatBytes(video.size_bytes)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

