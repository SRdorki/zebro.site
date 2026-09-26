import Link from "next/link";
import { ArrowLeft, Cloud, Shield, Zap, Server, Activity, Lock } from "lucide-react";

export default function InfraPage() {
  return (
    <div className="selection-blue min-h-screen bg-white text-zinc-900 font-sans relative overflow-x-hidden pt-24 pb-20">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,white_40%,transparent_80%)]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para o início
        </Link>

        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900 tracking-wider uppercase">Infraestrutura Global</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Projetado para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Escala Global</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed">
            Entregamos vídeos em milissegundos para qualquer lugar do mundo. Nossa arquitetura combina o poder da AWS e a capilaridade da Cloudflare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Edge Computing (Cloudflare)</h3>
            <p className="text-zinc-600 leading-relaxed">
              Utilizamos a vasta rede da Cloudflare para entregar o conteúdo o mais próximo possível do seu usuário final. Com centenas de pontos de presença (PoPs) espalhados pelo mundo, reduzimos a latência a níveis quase imperceptíveis.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Transcoding em Alta Velocidade (AWS)</h3>
            <p className="text-zinc-600 leading-relaxed">
              O processamento pesado dos seus vídeos é feito utilizando os servidores de altíssima performance da AWS. Convertendo automaticamente seu vídeo original em múltiplas qualidades (1080p, 720p, 480p) em tempo recorde.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Segurança Antifraude</h3>
            <p className="text-zinc-600 leading-relaxed">
              Proteção contra downloads não autorizados e pirataria utilizando URLs assinadas dinamicamente e validações de integridade em tempo real garantidas pelo nosso back-end inteligente.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Zero Buffering</h3>
            <p className="text-zinc-600 leading-relaxed">
              Nosso player customizado detecta automaticamente a velocidade da internet do usuário (Adaptive Bitrate Streaming) e entrega a melhor qualidade possível sem travamentos, de forma invisível e transparente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
