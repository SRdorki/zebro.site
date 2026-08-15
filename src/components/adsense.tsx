"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function Adsense() {
  const pathname = usePathname();
  
  // Bloqueia o carregamento de anúncios APENAS quando o player for incorporado (iframe) em outros sites
  if (pathname?.startsWith('/embed/')) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5878813660941262"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
