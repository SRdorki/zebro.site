"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

export function ZebroPlayer({ 
  videoPath, 
  videoId, 
  workspaceId,
  autoplay = false,
  muted = false,
  loop = false,
  allowSeek = true
}: { 
  videoPath: string, 
  videoId: string, 
  workspaceId: string,
  autoplay?: boolean,
  muted?: boolean,
  loop?: boolean,
  allowSeek?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!videoPath) return;
      const { data, error } = await supabase.storage
        .from("videos_bucket")
        .createSignedUrl(videoPath, 60 * 60);
        
      if (data) {
        setSignedUrl(data.signedUrl);
      } else {
        setVideoError("Erro ao acessar o vídeo (URL expirada ou arquivo não encontrado).");
        console.error("Erro ao gerar URL do vídeo:", error);
      }
    };
    fetchSignedUrl();

    const recordView = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("daily_video_stats")
        .select("views")
        .eq("video_id", videoId)
        .eq("date", today)
        .single();

      if (data) {
        await supabase
          .from("daily_video_stats")
          .update({ views: data.views + 1 })
          .eq("video_id", videoId)
          .eq("date", today);
      } else {
        await supabase
          .from("daily_video_stats")
          .insert({
            workspace_id: workspaceId,
            video_id: videoId,
            date: today,
            views: 1
          });
      }
    };
    recordView();
  }, [videoPath, videoId, workspaceId, supabase]);

  const togglePlay = () => {
    if (videoError) return;
    if (videoRef.current && signedUrl) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => {
          console.error("Erro ao reproduzir:", e);
          if (e.name === "NotSupportedError") {
            setVideoError("Formato de vídeo não suportado pelo navegador.");
          }
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!allowSeek || !progressBarRef.current || !videoRef.current) return;
    if (!Number.isFinite(videoRef.current.duration)) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoError = (e: any) => {
    const error = videoRef.current?.error;
    console.error("Video Load Error:", error);
    if (error?.code === 4) {
      setVideoError("Formato de vídeo não suportado ou arquivo corrompido.");
    } else {
      setVideoError("Erro ao carregar o vídeo.");
    }
  };

  return (
    <div ref={containerRef} className="relative group bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-video">
      {videoError ? (
        <div className="text-white text-sm bg-red-500/20 p-4 rounded-lg flex flex-col items-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-200">{videoError}</p>
        </div>
      ) : !signedUrl ? (
        <div className="text-white text-sm">Carregando vídeo...</div>
      ) : (
        <video
          ref={videoRef}
          src={signedUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
          onEnded={() => {
            if (!loop) setIsPlaying(false);
          }}
          onError={handleVideoError}
          autoPlay={autoplay}
          muted={isMuted}
          loop={loop}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
        {/* Progress Bar (Click Area) */}
        <div 
          ref={progressBarRef}
          className={`w-full h-6 flex items-center group/progress ${allowSeek ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={handleProgressClick}
        >
          {/* Visual Bar */}
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden transition-all group-hover/progress:h-2">
            <div 
              className="h-full bg-primary relative" 
              style={{ width: `${progress}%` }} 
            >
              {/* Playhead thumb (optional, visible on hover) */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full opacity-0 group-hover/progress:opacity-100" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-primary transition-colors" disabled={!!videoError}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} className="hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:text-primary transition-colors focus:outline-none">
                <Settings className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10 text-white backdrop-blur-md">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-white/70">Velocidade</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <DropdownMenuItem 
                    key={speed}
                    className="focus:bg-white/10 cursor-pointer"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = speed;
                      }
                    }}
                  >
                    {speed === 1 ? "Normal" : `${speed}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {!isPlaying && progress === 0 && signedUrl && !videoError && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 m-auto h-16 w-16 bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
        >
          <Play className="h-8 w-8 ml-1" />
        </button>
      )}
    </div>
  );
}

