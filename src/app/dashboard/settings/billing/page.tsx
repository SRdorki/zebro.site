"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [billingType, setBillingType] = useState<'CREDIT_CARD' | 'PIX'>('PIX');
  
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingType, planValue: 49.90 })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erro no checkout");

      toast.success("Assinatura criada com sucesso!");
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faturamento & Assinatura</h1>
        <p className="text-muted-foreground mt-2">Gerencie seu plano e veja seu histórico de pagamentos.</p>
      </div>

      <div className="space-y-6 border p-6 rounded-xl bg-card">
        <h2 className="text-xl font-semibold border-b pb-2">Plano Atual</h2>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-lg">Plano Pro</p>
            <p className="text-sm text-muted-foreground">R$ 49,90 / mês</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={billingType === 'PIX' ? 'default' : 'outline'} 
              onClick={() => setBillingType('PIX')}
            >
              Pix
            </Button>
            <Button 
              variant={billingType === 'CREDIT_CARD' ? 'default' : 'outline'} 
              onClick={() => setBillingType('CREDIT_CARD')}
            >
              Cartão
            </Button>
          </div>
        </div>

        <Button onClick={handleCheckout} disabled={loading} className="w-full md:w-auto">
          {loading ? "Processando..." : "Assinar Agora"}
        </Button>
      </div>
    </div>
  );
}
