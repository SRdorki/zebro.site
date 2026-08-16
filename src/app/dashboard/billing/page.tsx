import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Check } from "lucide-react";

import { CheckoutButton } from "@/components/checkout-button";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  if (bytes === Infinity) return '∞';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get("zebro-workspace")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let totalStorageBytes = 0;
  let totalViews = 0;
  let currentPlan = 'none'; // default
  let actualWorkspaceId = workspaceId;

  if (!actualWorkspaceId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: wm } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (wm) actualWorkspaceId = wm.workspace_id;
    }
  }

  if (actualWorkspaceId) {
    // Busca o plano do workspace
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", actualWorkspaceId)
      .single();
    
    if (wsData?.plan) currentPlan = wsData.plan;

    const { data: videosData } = await supabase
      .from("videos")
      .select("size_bytes")
      .eq("workspace_id", actualWorkspaceId);

    if (videosData) {
      totalStorageBytes = videosData.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
    }

    const { data: viewsData } = await supabase
      .from("daily_video_stats")
      .select("views")
      .eq("workspace_id", actualWorkspaceId);

    if (viewsData) {
      totalViews = viewsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
    }
  }

  const estimatedBandwidthBytes = totalViews * 15 * 1024 * 1024; 

  // Limits Logic based on Plan
  const isInfinite = currentPlan === '197' || currentPlan === '297';
  
  let storageLimitBytes = 0;
  let bandwidthLimitBytes = 0;

  if (isInfinite) {
    storageLimitBytes = Infinity;
    bandwidthLimitBytes = Infinity;
  } else if (currentPlan === '97') {
    storageLimitBytes = 100 * 1024 * 1024 * 1024; // 100 GB
    bandwidthLimitBytes = 500 * 1024 * 1024 * 1024; // 500 GB
  } else {
    // Free plan limits
    storageLimitBytes = 5 * 1024 * 1024 * 1024; // 5 GB
    bandwidthLimitBytes = 50 * 1024 * 1024 * 1024; // 50 GB
  }

  const storagePercentage = isInfinite ? 100 : Math.min(100, (totalStorageBytes / storageLimitBytes) * 100);
  const bandwidthPercentage = isInfinite ? 100 : Math.min(100, (estimatedBandwidthBytes / bandwidthLimitBytes) * 100);

  const plans = [
    { 
      id: 'free', name: 'Básico', price: 'Grátis', numericValue: 0,
      features: ['Vídeos retidos por 14 dias', 'Com Anúncios', '5 GB Armazenamento'],
      paymentLink: null
    },
    { 
      id: '97', name: 'Essencial', price: 'R$ 97', numericValue: 97,
      features: ['Retenção Ilimitada', 'Sem Anúncios', '100 GB Armazenamento', '500 GB Bandwidth'],
      paymentLink: process.env.NEXT_PUBLIC_ASAAS_LINK_97 || null
    },
    { 
      id: '197', name: 'Pro', price: 'R$ 197', numericValue: 197,
      features: ['Armazenamento Infinito', 'Bandwidth Ilimitado', 'Suporte Prioritário'],
      paymentLink: process.env.NEXT_PUBLIC_ASAAS_LINK_197 || null
    },
    { 
      id: '297', name: 'Premium', price: 'R$ 297', numericValue: 297,
      features: ['Armazenamento Infinito', 'Bandwidth Ilimitado', 'Acesso Administrativo', 'Suporte VIP'],
      paymentLink: process.env.NEXT_PUBLIC_ASAAS_LINK_297 || null
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinaturas e Limites</h1>
        <p className="text-muted-foreground mt-2">Gerencie seu plano atual e acompanhe seu uso de infraestrutura.</p>
      </div>

      {/* Uso do Workspace */}
      <div className="border rounded-xl p-6 bg-card space-y-6">
        <h2 className="text-xl font-semibold">Uso Atual do Workspace</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Armazenamento (Vídeos)</span>
              <span className="text-muted-foreground">
                {formatBytes(totalStorageBytes)} / {isInfinite ? '∞' : formatBytes(storageLimitBytes)}
              </span>
            </div>
            {isInfinite ? (
              <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/50 w-full animate-pulse" />
              </div>
            ) : (
              <Progress value={storagePercentage} className="h-2" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Bandwidth Estimado (Streaming)</span>
              <span className="text-muted-foreground">
                {formatBytes(estimatedBandwidthBytes)} / {isInfinite ? '∞' : formatBytes(bandwidthLimitBytes)}
              </span>
            </div>
            {isInfinite ? (
              <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/50 w-full animate-pulse" />
              </div>
            ) : (
              <Progress value={bandwidthPercentage} className="h-2" />
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Planos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Nossos Planos</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isActive = currentPlan === p.id;
            return (
              <div key={p.id} className={`border rounded-xl p-6 flex flex-col relative overflow-hidden transition-all ${isActive ? 'bg-primary/5 border-primary shadow-sm shadow-primary/20' : 'bg-card hover:border-primary/50'}`}>
                {isActive && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Seu Plano
                  </div>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black">{p.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">/mês</span>
                </div>
                
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <Button className="w-full mt-8" variant="outline" disabled>
                    Plano Atual
                  </Button>
                ) : p.id === 'free' && currentPlan === 'none' ? (
                  <form action={async () => {
                    "use server";
                    const { selectFreePlan } = await import('./actions');
                    if (actualWorkspaceId) await selectFreePlan(actualWorkspaceId);
                  }}>
                    <Button className="w-full mt-8" variant="default" type="submit">
                      Começar Grátis
                    </Button>
                  </form>
                ) : p.id === 'free' ? (
                  <Button className="w-full mt-8" variant="outline" disabled>
                    Grátis
                  </Button>
                ) : (
                  <CheckoutButton plan={p} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

