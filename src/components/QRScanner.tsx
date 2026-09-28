"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }: { onScan: (text: string) => void, onError: (err: any) => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render((decodedText) => {
      scanner.clear();
      onScan(decodedText);
    }, (error) => {
      // onError(error);
    });

    // Monitora se o vídeo da câmera apareceu para ligar a animação da borda
    const interval = setInterval(() => {
      const video = document.querySelector('#qr-reader video');
      setIsScanning(!!video);
    }, 500);

    return () => {
      clearInterval(interval);
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl p-1 bg-zinc-900 overflow-hidden shadow-2xl shadow-purple-900/10">
      
      {/* Efeito de Borda Animada (Conic Gradient) */}
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_280deg,#5b32f5_360deg)] animate-[spin_2.5s_linear_infinite] z-0"></div>
      )}

      {/* Container Principal */}
      <div className="absolute inset-1 z-10 bg-[#050505] rounded-xl overflow-hidden flex flex-col items-center justify-center">
        <div id="qr-reader" className="w-full h-full flex flex-col items-center justify-center"></div>
      </div>

      {/* Estilos Globais para Sobrescrever a UI feia do html5-qrcode */}
      <style dangerouslySetInnerHTML={{ __html: `
        #qr-reader {
          border: none !important;
          width: 100% !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        /* Esconde a caixa de borda padrão do plugin se o vídeo preencher a tela */
        #qr-reader__scan_region {
          background-color: #050505 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100% !important;
          width: 100% !important;
        }
        #qr-reader video {
          border-radius: 12px !important;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        /* Botões do Scanner */
        #qr-reader button {
          background-color: #5b32f5 !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          margin: 8px !important;
          transition: all 0.2s !important;
          box-shadow: 0 4px 14px 0 rgba(91, 50, 245, 0.2) !important;
        }
        #qr-reader button:hover {
          background-color: #4f2ce0 !important;
          transform: translateY(-1px) !important;
        }
        /* Textos (Request Camera Permissions, etc) */
        #qr-reader__dashboard_section_csr span {
          color: #a1a1aa !important; /* zinc-400 */
          font-family: inherit !important;
          font-size: 14px !important;
          margin-bottom: 12px !important;
          display: block;
        }
        /* Select de câmeras */
        #qr-reader select {
          background-color: #18181b !important;
          color: white !important;
          border: 1px solid #27272a !important;
          padding: 10px !important;
          border-radius: 8px !important;
          margin: 10px 0 !important;
          outline: none !important;
          width: 80% !important;
        }
        /* Links chatos de "Scan Image" / "Scan using camera" */
        #qr-reader__dashboard_section_swaplink {
          color: #5b32f5 !important;
          text-decoration: none !important;
          font-weight: 500 !important;
          margin-top: 15px !important;
          display: inline-block;
        }
        /* Remover a logo do html5-qrcode se aparecer */
        #qr-reader a {
          opacity: 0.8 !important;
        }
      `}} />
    </div>
  );
}
