"use client";

import { useEffect, useRef } from "react";

export function AdBanner() {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    try {
      if (!isLoaded.current && adRef.current) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  // Em ambiente de desenvolvimento, renderizamos um placeholder escuro para não ficar um buraco branco
  if (process.env.NODE_ENV === "development") {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 h-32 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
        <span className="text-white/40 text-sm font-medium">Área de Anúncio AdSense (Bloqueado no Localhost)</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden text-center my-8 min-h-[100px]">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5878813660941262"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
