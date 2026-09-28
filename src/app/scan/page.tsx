"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';

export default function ScanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleScan = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.priv && data.pub) {
        localStorage.setItem('refugio_priv', data.priv);
        localStorage.setItem('refugio_pub', data.pub);
        localStorage.setItem('refugio_mobile_session', Date.now().toString());
        alert('Identidade transferida com sucesso para o celular!');
        router.push('/404');
      } else {
        alert('QR Code inválido.');
      }
    } catch (e) {
      alert('Falha ao ler QR Code.');
    }
  };

  if (!mounted) return <div className="bg-black h-screen w-screen"></div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 font-sans">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-xl mb-4 font-bold tracking-widest text-[#5b32f5]">Sincronização Mobile</h1>
        <p className="text-zinc-400 text-sm mb-8 text-center px-4 leading-relaxed">
          Aponte a câmera para o QR Code gerado no seu computador para puxar a identidade (Chave Privada) para este celular.
        </p>
        
        <div className="w-full bg-[#0a0a0a] p-2 rounded-2xl shadow-xl shadow-purple-900/10 border border-zinc-800">
          <QRScanner onScan={handleScan} onError={() => {}} />
        </div>

        <button 
          onClick={() => router.push('/404')} 
          className="mt-8 text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          Ir para o Disfarce (404)
        </button>
      </div>
    </div>
  );
}
