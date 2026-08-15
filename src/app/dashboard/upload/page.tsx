import { Uploader } from "@/components/upload/uploader";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload de Vídeos</h1>
        <p className="text-muted-foreground mt-2">
          Envie seus vídeos para a Zebro. Eles serão processados e disponibilizados imediatamente.
        </p>
      </div>
      <Uploader />
    </div>
  );
}

