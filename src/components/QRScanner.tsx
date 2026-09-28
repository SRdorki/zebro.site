"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }: { onScan: (text: string) => void, onError: (err: any) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Usar Html5Qrcode diretamente (em vez de Scanner) pula toda a interface padrão de botões e links
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" }, // Força a câmera traseira
      {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        // Sucesso
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(() => {
          onScan(decodedText);
        });
      },
      (errorMessage) => {
        // Erros de leitura por frame (ignorar)
      }
    ).then(() => {
      setIsScanning(true);
      setPermissionDenied(false);
    }).catch((err) => {
      console.warn("Falha ao iniciar a câmera", err);
      // Pode ser erro de permissão ou não ter câmera traseira
      setPermissionDenied(true);
      if (onError) onError(err);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("Failed to stop scanner", e));
      }
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl p-1 bg-zinc-900 overflow-hidden shadow-2xl shadow-purple-900/10">
      
      {/* Efeito de Borda Animada (Conic Gradient) quando estiver escaneando */}
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_280deg,#5b32f5_360deg)] animate-[spin_2.5s_linear_infinite] z-0"></div>
      )}

      {/* Container Principal */}
      <div className="absolute inset-1 z-10 bg-[#050505] rounded-xl overflow-hidden flex flex-col items-center justify-center">
        {permissionDenied && (
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </div>
            <p className="text-sm text-zinc-400 font-medium">Câmera bloqueada</p>
            <p className="text-xs text-zinc-600 mt-1">Permita o acesso à câmera e recarregue a página.</p>
          </div>
        )}
        <div id="qr-reader" className={`w-full h-full flex flex-col items-center justify-center ${permissionDenied ? 'hidden' : ''}`}></div>
      </div>

      {/* Estilos Globais para garantir que o vídeo preencha a div sem outras UIs */}
      <style dangerouslySetInnerHTML={{ __html: `
        #qr-reader {
          border: none !important;
          width: 100% !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        #qr-reader video {
          border-radius: 12px !important;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          position: absolute;
          top: 0;
          left: 0;
        }
        #qr-shaded-region {
          border-width: 25px !important;
          border-color: rgba(0,0,0,0.6) !important;
        }
      `}} />
    </div>
  );
}
