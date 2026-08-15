"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, FileVideo, AlertCircle, Loader2 } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { AdBanner } from "@/components/ad-banner";

type UploadStatus = "QUEUED" | "TRANSCODING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

type FileItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
};

export function Uploader() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    const loadFFmpeg = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('log', ({ message }) => {
        console.log("FFmpeg Log:", message);
      });
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setIsFfmpegLoaded(true);
    };
    loadFFmpeg().catch(console.error);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "QUEUED" as UploadStatus,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
    },
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const transcodeFile = async (file: File, onProgress: (p: number) => void): Promise<File> => {
    const ffmpeg = ffmpegRef.current;
    const inputFileName = `input_${Math.random().toString(36).slice(2)}`;
    const outputFileName = `output_${Math.random().toString(36).slice(2)}.mp4`;

    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
    });

    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    
    // Conversão rápida para H.264 (compatibilidade universal)
    await ffmpeg.exec(['-i', inputFileName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac', outputFileName]);
    
    const data = await ffmpeg.readFile(outputFileName);
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    // Limpar listener para evitar vazamento se outro transcode ocorrer
    ffmpeg.off('progress', () => {});
    
    return new File([data as any], file.name.replace(/\.[^/.]+$/, "") + ".mp4", { type: 'video/mp4' });
  };

  const uploadFile = async (item: FileItem) => {
    if (!activeWorkspace) {
      toast.error("Nenhum workspace ativo!");
      return;
    }
    
    if (!isFfmpegLoaded) {
      toast.info("O conversor de vídeo ainda está carregando. Tente novamente em alguns segundos.");
      return;
    }

    try {
      // 1. Criar registro no banco primeiro
      const { data: videoRecord, error: dbError } = await supabase
        .from("videos")
        .insert({
          workspace_id: activeWorkspace.id,
          title: item.file.name.replace(/\.[^/.]+$/, ""),
          status: "PROCESSING",
          size_bytes: item.file.size,
          privacy: "PRIVATE"
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Transcodificação local (WASM)
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "TRANSCODING", error: undefined, progress: 0 } : f))
      );

      const transcodedFile = await transcodeFile(item.file, (p) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id && f.status === "TRANSCODING" ? { ...f, progress: p } : f))
        );
      });

      // 3. Upload para o Supabase
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "UPLOADING", progress: 0 } : f))
      );

      const filePath = `${activeWorkspace.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;

      // Simular progresso do upload enquanto o Supabase native não suporta
      let uploadProgress = 5;
      const interval = setInterval(() => {
        uploadProgress += Math.random() * 15;
        if (uploadProgress > 90) uploadProgress = 90;
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id && f.status === "UPLOADING" ? { ...f, progress: Math.floor(uploadProgress) } : f))
        );
      }, 600);

      const { error: uploadError } = await supabase.storage
        .from("videos_bucket")
        .upload(filePath, transcodedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "video/mp4"
        });

      clearInterval(interval);

      if (uploadError) {
        await supabase.from("videos").update({ status: "FAILED" }).eq("id", videoRecord.id);
        throw uploadError;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, progress: 100, status: "READY" } : f))
      );
      
      toast.success(`${item.file.name} enviado com sucesso!`);

      // 4. Atualizar registro final
      await supabase
        .from("videos")
        .update({ 
          status: "READY",
          file_path: filePath,
          size_bytes: transcodedFile.size 
        })
        .eq("id", videoRecord.id);

    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "FAILED", error: err.message || "Erro no processamento" } : f
        )
      );
      toast.error(`Erro ao processar ${item.file.name}: ${err.message || "Erro desconhecido"}`);
    }
  };

  const uploadAll = () => {
    try {
      if (!activeWorkspace) {
        toast.error("Nenhum workspace ativo. Faça login ou recarregue a página.");
        return;
      }
      if (!isFfmpegLoaded) {
        toast.info("Aguarde o carregamento do módulo de conversão (FFmpeg) antes de iniciar.");
        return;
      }
      const queued = files.filter((f) => f.status === "QUEUED" || f.status === "FAILED");
      if (queued.length === 0) {
        toast.info("A fila de upload está vazia ou os vídeos já foram enviados.");
        return;
      }
      queued.forEach((f) => uploadFile(f));
    } catch (e: any) {
      toast.error("Erro crítico no uploadAll: " + e.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-semibold">Arraste seus vídeos aqui</p>
            <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar arquivos</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">MP4, WebM (Garante compatibilidade total no navegador)</p>
        </div>
      </div>

      {/* Fila */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Fila de Upload ({files.length})</h3>
            <Button type="button" onClick={uploadAll} disabled={files.every(f => f.status === "READY" || f.status === "UPLOADING")}>
              Iniciar Uploads
            </Button>
          </div>

          <div className="grid gap-3">
            {files.map((file) => (
              <div key={file.id} className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <FileVideo className="h-6 w-6 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium truncate" title={file.file.name}>
                        {file.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={
                      file.status === "READY" ? "default" :
                      file.status === "FAILED" ? "destructive" :
                      file.status === "UPLOADING" || file.status === "TRANSCODING" ? "secondary" : "outline"
                    }>
                      {file.status === "TRANSCODING" ? "CONVERTENDO" : file.status}
                    </Badge>
                    {file.status !== "UPLOADING" && file.status !== "TRANSCODING" && file.status !== "READY" && (
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {(file.status === "UPLOADING" || file.status === "TRANSCODING") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {file.status === "TRANSCODING" ? "Processando e otimizando vídeo..." : "Enviando para a nuvem..."}
                      </span>
                      <span>{file.progress}%</span>
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}
                
                {file.status === "FAILED" && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{file.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anúncio AdSense para o plano gratuito */}
      {activeWorkspace?.plan === 'free' && (
        <div className="pt-8">
          <AdBanner />
        </div>
      )}
    </div>
  );
}
