"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }: { onScan: (text: string) => void, onError: (err: any) => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 350, height: 350 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render((decodedText) => {
      scanner.clear();
      onScan(decodedText);
    }, (error) => {
      // onError(error); // Silenciar os logs de falha por frame
    });

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan, onError]);

  return (
    <div className="w-full bg-[#050505] rounded-xl overflow-hidden border border-zinc-800">
      <div id="qr-reader" className="w-full" style={{ border: 'none' }}></div>
    </div>
  );
}
