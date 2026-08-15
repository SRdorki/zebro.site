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

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden text-center my-8">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5878813660941262"
        data-ad-slot="auto" // Como não foi fornecido um ID de bloco específico, o Google cuidará caso seja AutoAds
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
