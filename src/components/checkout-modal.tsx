"use client";

import { useState } from "react";
import { X, QrCode, CreditCard, Loader2, Copy, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

type Plan = {
  id: string;
  name: string;
  price: string;
  numericValue: number;
  paymentLink: string | null;
};

type PaymentMethod = "PIX" | "CREDIT_CARD";

type Step = "choose" | "pix_form" | "pix_qr" | "card_redirect";

interface CheckoutModalProps {
  plan: Plan;
  onClose: () => void;
}

export function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  // PIX result
  const [pixCode, setPixCode] = useState("");
  const [pixQrBase64, setPixQrBase64] = useState("");

  const handleContinue = async () => {
    if (method === "CREDIT_CARD") {
      if (plan.paymentLink) {
        window.open(plan.paymentLink, "_blank");
        onClose();
      }
      return;
    }

    // PIX flow
    if (!name.trim() || !email.trim() || !cpf.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingType: "PIX",
          planValue: plan.numericValue,
          customerName: name,
          customerEmail: email,
          customerCpf: cpf.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");

      setPixCode(data.pixCode || "");
      setPixQrBase64(data.pixQrBase64 || "");
      setStep("pix_qr");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Código copiado!");
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-background rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Você selecionou:
            </p>
            <h2 className="font-bold text-lg mt-0.5">
              {plan.name} · {plan.price}/mês
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Step: Choose Method */}
          {(step === "choose" || step === "pix_form") && (
            <>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Forma de pagamento:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* PIX */}
                  <button
                    onClick={() => { setMethod("PIX"); setStep("choose"); }}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                      method === "PIX"
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method === "PIX" ? "bg-primary" : "bg-white/10"}`}>
                      <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm">PIX</span>
                    <span className="text-xs text-muted-foreground">Aprovação instantânea</span>
                  </button>

                  {/* Cartão */}
                  <button
                    onClick={() => { setMethod("CREDIT_CARD"); setStep("choose"); }}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                      method === "CREDIT_CARD"
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method === "CREDIT_CARD" ? "bg-primary" : "bg-white/10"}`}>
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm">Cartão</span>
                    <span className="text-xs text-muted-foreground">Renovação automática</span>
                  </button>
                </div>
              </div>

              {/* PIX Form */}
              {method === "PIX" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nome completo</Label>
                    <Input
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      className="h-11 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                ) : method === "PIX" ? (
                  <><Zap className="mr-2 h-4 w-4" /> Gerar PIX</>
                ) : (
                  "Continuar pagamento →"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                🔒 Pagamento processado com segurança via Asaas
              </p>
            </>
          )}

          {/* Step: PIX QR Code */}
          {step === "pix_qr" && (
            <div className="space-y-4 text-center">
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando pagamento — atualiza sozinho
              </div>

              {pixQrBase64 && (
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl">
                    <img
                      src={`data:image/png;base64,${pixQrBase64}`}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Escaneie no app do banco ou copie o código:
              </p>

              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-left truncate font-mono text-muted-foreground">
                  {pixCode.substring(0, 40)}...
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-auto px-3"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="flex justify-between text-sm pt-1 border-t border-white/10">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{plan.price}/mês</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
