import Link from "next/link";
import { ArrowRight, Bot, Code, Zap, Layers, Star, User, Check, PlaySquare, Cloud, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="selection-blue min-h-screen bg-white text-zinc-900 font-sans relative overflow-x-hidden">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white"></div>
        <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]"></div>
        <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,white_40%,transparent_80%)]"></div>
      </div>

      {/* Top Blur Header */}
      <div className="gradient-blur"></div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 pt-6 px-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between bg-white/60 backdrop-blur-xl border border-black/10 rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Zebro Logo" className="h-6 w-auto" />
            <span className="text-lg font-bold tracking-tight">Zebro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-700 hover:text-zinc-900">Log In</Link>
            <Link href="/register">
              <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95">
                  <span className="absolute inset-0 border border-black/10 rounded-full"></span>
                  <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#2563eb_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="absolute inset-[1px] rounded-full bg-white"></span>
                  <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      Começar <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-black/10 backdrop-blur-md mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]"></span>
                </span>
                <span className="text-xs font-medium text-blue-900/90 tracking-wide">
                    Zebro Streaming 2.0 está online
                </span>
                <ArrowRight className="w-3 h-3 text-blue-500" />
            </div>

            <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter leading-[1.1] mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-500">Streaming Ultra-Rápido</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-500">
                    para o <span className="text-[#2563eb] inline-block relative font-serif italic" style={{ fontFamily: "var(--font-instrument-serif), serif" }}>
                        Futuro
                        <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#2563eb] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
                Hospede, distribua e analise seus vídeos com a plataforma de alta performance desenhada para empresas inovadoras.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <Link href="/register">
                  <button className="shiny-cta group">
                      <span className="relative z-10 flex items-center gap-2 text-zinc-900 font-medium">
                          Criar Conta Grátis <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </span>
                  </button>
                </Link>
                
                <Link href="#features">
                  <button className="group px-8 py-4 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium hover:text-zinc-900 hover:bg-zinc-200 transition-all flex items-center gap-2">
                      <PlaySquare className="w-5 h-5" />
                      Ver como funciona
                  </button>
                </Link>
            </div>
          </div>

          {/* Logo Strip */}
          <div className="w-full mt-32 border-y border-black/5 bg-black/[0.02] backdrop-blur-sm py-10 opacity-60 hover:opacity-100 transition-opacity">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                  <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase shrink-0">Powered by:</p>
                  <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full">
                      <div className="flex items-center gap-2 font-bold"><div className="w-6 h-6 bg-white/20 rounded-full"></div>AWS</div>
                      <div className="flex items-center gap-2 font-bold"><div className="w-6 h-6 bg-white/20 rounded-full"></div>Cloudflare</div>
                      <div className="flex items-center gap-2 font-bold"><div className="w-6 h-6 bg-white/20 rounded-full"></div>Next.js</div>
                      <div className="flex items-center gap-2 font-bold"><div className="w-6 h-6 bg-white/20 rounded-full"></div>Supabase</div>
                      <div className="flex items-center gap-2 font-bold"><div className="w-6 h-6 bg-white/20 rounded-full"></div>Stripe</div>
                  </div>
              </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
                    <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight mb-6">
                        O Sistema Operacional para <br />
                        <span className="text-[#2563eb] font-serif italic" style={{ fontFamily: "var(--font-instrument-serif), serif" }}>Produtores de Conteúdo</span>
                    </h2>
                    <p className="text-lg text-zinc-600 font-light">
                        Substitua dezenas de ferramentas lentas por uma única plataforma de alta performance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[700px]">
                    {/* Main Feature Card */}
                    <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-black/10 bg-gradient-to-b from-zinc-100/50 to-white hover:border-black/20 transition-all rounded-xl">
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="mb-6 inline-flex p-3 rounded-lg bg-white/5 border border-black/10 text-[#2563eb]">
                                <Cloud className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-semibold text-zinc-900 mb-4 tracking-tight">CDN Global Inteligente</h3>
                            <p className="text-zinc-600 text-lg leading-relaxed">Nossa infraestrutura distribui seus vídeos globalmente através de edge nodes espalhados pelo mundo. Carregamento quase instantâneo e zero buffering em 4K para a melhor experiência do seu usuário.</p>
                            <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <span className="text-xs font-mono text-[#2563eb]">EXPLORAR INFRA</span>
                                <ArrowRight className="w-4 h-4 text-[#2563eb]" />
                            </div>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #2563eb, transparent 70%)' }}></div>
                    </div>

                    {/* Feature 2 */}
                    <div className="lg:col-span-2 group relative overflow-hidden p-8 border border-black/10 bg-white hover:border-black/20 transition-all rounded-xl">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-black/10 text-blue-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-semibold text-zinc-900 mb-2">Segurança Row-Level (RLS)</h3>
                            <p className="text-zinc-600">Seus vídeos estão 100% seguros com autenticação de nível militar e assinaturas de URL criptografadas no banco.</p>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #3b82f6, transparent 70%)' }}></div>
                    </div>

                    {/* Feature 3 */}
                    <div className="group relative overflow-hidden p-8 border border-black/10 bg-white hover:border-black/20 transition-all rounded-xl">
                        <div className="relative z-10">
                            <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-black/10 text-yellow-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Transcoding Smart</h3>
                            <p className="text-sm text-zinc-600">Geração automática de múltiplas qualidades de vídeo via hardware.</p>
                        </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="group relative overflow-hidden p-8 border border-black/10 bg-white hover:border-black/20 transition-all rounded-xl">
                        <div className="relative z-10">
                            <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-black/10 text-purple-400">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Workspaces</h3>
                            <p className="text-sm text-zinc-600">Crie times e gerencie espaços diferentes para cada cliente de forma isolada.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonial Banner */}
        <div className="w-full bg-[#2563eb] py-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <div className="flex justify-center gap-1 text-zinc-900 mb-6">
                    <Star className="w-6 h-6 fill-current" />
                    <Star className="w-6 h-6 fill-current" />
                    <Star className="w-6 h-6 fill-current" />
                    <Star className="w-6 h-6 fill-current" />
                    <Star className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-tight mb-8">
                    "O Zebro revolucionou a forma como entregamos conteúdo. Nossas aulas carregam instântaneamente em qualquer lugar do Brasil."
                </h3>
                <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center">
                        <User className="text-zinc-900 w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="text-zinc-900 font-bold text-lg">Alex Morgan</div>
                        <div className="text-zinc-900/70 font-medium">EdTech Founder</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Pricing */}
        <section id="pricing" className="py-32 px-6 bg-white relative border-t border-black/5">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 mb-4">Preços Simples e Transparentes</h2>
                    <p className="text-zinc-600">Comece de graça, escale com o seu sucesso.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Starter */}
                    <div className="p-8 border border-zinc-200 bg-white hover:border-zinc-300 transition-all rounded-xl flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Básico</h3>
                        <p className="text-zinc-500 text-sm mb-8 h-10">Para criadores explorando a plataforma.</p>
                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-zinc-500">R$</span>
                            <span className="text-5xl font-bold text-zinc-900">0</span>
                            <span className="text-zinc-500 text-sm">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Retenção por 14 Dias</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> 5 GB de Armazenamento</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Player com Anúncios</li>
                        </ul>
                        <Link href="/register">
                          <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-zinc-900 border border-black/10 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Começar</button>
                        </Link>
                    </div>

                    {/* Pro */}
                    <div className="relative p-8 border border-[#2563eb] bg-zinc-100/40 shadow-[0_0_30px_rgba(37,99,235,0.1)] rounded-xl flex flex-col scale-105 z-10">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-zinc-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Recomendado</div>
                        <h3 className="text-xl font-bold mb-2">Essencial</h3>
                        <p className="text-zinc-600 text-sm mb-8 h-10">Para profissionais e infoprodutores em escala.</p>
                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-zinc-500">R$</span>
                            <span className="text-5xl font-bold text-zinc-900">97</span>
                            <span className="text-zinc-500 text-sm">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Retenção Ilimitada</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> 100 GB Armazenamento</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> 500 GB Bandwidth</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Player Limpo (Sem Ads)</li>
                        </ul>
                        <Link href="/register">
                          <button className="w-full py-3 px-4 bg-[#2563eb] hover:bg-blue-700 text-zinc-900 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Assinar Essencial</button>
                        </Link>
                    </div>

                    {/* Team */}
                    <div className="p-8 border border-zinc-200 bg-white hover:border-zinc-300 transition-all rounded-xl flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Pro</h3>
                        <p className="text-zinc-500 text-sm mb-8 h-10">Para grandes operações e plataformas de EAD.</p>
                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-zinc-500">R$</span>
                            <span className="text-5xl font-bold text-zinc-900">197</span>
                            <span className="text-zinc-500 text-sm">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Armazenamento Infinito</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Bandwidth Ilimitado</li>
                            <li className="flex items-center gap-3 text-sm text-zinc-700"><Check className="text-[#2563eb] w-5 h-5" /> Suporte Prioritário</li>
                        </ul>
                        <Link href="/register">
                          <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-zinc-900 border border-black/10 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Assinar Pro</button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Waitlist */}
        <section className="py-32 px-6 text-center bg-zinc-50/40">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">Pronto para <span className="text-[#2563eb] font-serif italic" style={{ fontFamily: "var(--font-instrument-serif), serif" }}>Construir?</span></h2>
                <p className="text-xl text-zinc-600 mb-12">Crie sua conta agora mesmo e teste nossos recursos gratuitamente.</p>
                
                <div className="max-w-md mx-auto">
                  <Link href="/register">
                    <button className="w-full bg-[#2563eb] hover:bg-blue-700 text-zinc-900 font-bold rounded-full px-8 py-4 transition-all flex items-center justify-center gap-2">
                      Criar Conta Grátis <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 pt-20 pb-10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-24 relative z-10">
              <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                      <img src="/logo.svg" alt="Zebro Logo" className="h-6 w-auto" />
                      <span className="text-2xl font-bold tracking-tight">Zebro</span>
                  </div>
                  <p className="text-zinc-500 max-w-xs leading-relaxed">A infraestrutura de vídeo definitiva para criadores de conteúdo e plataformas EAD de alta escala.</p>
              </div>
              
              <div>
                  <h4 className="text-xs font-bold text-[#2563eb] uppercase tracking-widest mb-6">Plataforma</h4>
                  <ul className="space-y-4 text-zinc-600 text-sm">
                      <li><Link href="#features" className="hover:text-zinc-900 transition-colors">Features</Link></li>
                      <li><Link href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
                      <li><Link href="#" className="hover:text-zinc-900 transition-colors">Documentation</Link></li>
                  </ul>
              </div>
              
              <div>
                  <h4 className="text-xs font-bold text-[#2563eb] uppercase tracking-widest mb-6">Empresa</h4>
                  <ul className="space-y-4 text-zinc-600 text-sm">
                      <li><Link href="#" className="hover:text-zinc-900 transition-colors">About</Link></li>
                      <li><Link href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
                      <li><Link href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
                  </ul>
              </div>
          </div>

          {/* Huge Footer Text */}
          <div className="flex justify-center items-center py-10 opacity-20 pointer-events-none">
              <h1 className="text-[15vw] leading-none font-bold tracking-tighter text-stroke select-none">ZEBRO</h1>
          </div>

          <div className="max-w-7xl mx-auto px-6 border-t border-zinc-200 pt-8 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
              <p>&copy; {new Date().getFullYear()} Zebro Video Infrastructure. Todos os direitos reservados.</p>
          </div>
      </footer>
    </div>
  );
}

