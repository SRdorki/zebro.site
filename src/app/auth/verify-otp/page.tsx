"use client";

import { useState, useRef, useEffect, Suspense, Fragment } from 'react';
import { Icon } from '@iconify/react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

function VerifyOTPForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const supabase = createClient();

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !/^[0-9]+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('E-mail not found. Please restart the process.');
      return;
    }
    setCountdown(30);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
      setCountdown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) return;
    
    if (!email) {
      setError('E-mail not found. Please restart the process.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Usually after recovery, Supabase creates a session. You can redirect to an update-password page.
      setTimeout(() => router.push('/update-password'), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Icon Tile */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 flex items-center justify-center shadow-md mb-6">
        <Icon icon="ph:lock-key-fill" className="text-paper text-[26px]" />
      </div>

      {/* Typography */}
      <h1 className="text-[26px] font-extrabold text-ink-900 tracking-tightest leading-tight mb-2 text-center">
        Verifique sua identidade
      </h1>
      <p className="text-[14px] text-ink-700/80 text-center max-w-[19rem]">
        Enviamos um código de 6 dígitos para <strong className="text-ink-900 font-semibold">{email ? email : 'seu e-mail'}</strong>. Insira-o abaixo para continuar.
      </p>
      
      <form onSubmit={handleSubmit} className="w-full">
        {/* OTP Input Row */}
        <div role="group" aria-label="One-time passcode" className="flex items-center justify-center gap-2.5 sm:gap-3 mt-8">
          {otp.map((digit, index) => (
            <Fragment key={index}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`otp-input w-[44px] sm:w-[50px] h-[58px] rounded-xl border border-ink-900/20 bg-white/70 dark:bg-paper2/70 text-center font-bold text-[22px] text-ink-900 shadow-inner transition-all duration-200 ${digit ? 'filled' : ''}`}
              />
              {index === 2 && (
                <div className="mx-0.5 h-px w-3 bg-platinum shrink-0"></div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {otp.map((digit, index) => (
            <div 
              key={`dot-${index}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${digit ? 'bg-ink-900' : 'bg-platinum'}`}
            ></div>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
        
        {success && (
          <p className="text-green-600 font-medium text-sm text-center mt-4">Código verificado! Redirecionando...</p>
        )}

        {/* Verify Button */}
        <button 
          type="submit"
          disabled={isSubmitting || success || otp.join('').length !== 6}
          className="verify-btn w-full mt-8 py-4 rounded-2xl bg-ink-900 text-paper text-[15px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(28,28,30,0.15)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Verificando...' : 'Verificar código'}
          {!isSubmitting && <Icon icon="ph:arrow-right-bold" />}
        </button>
      </form>

      {/* Resend Countdown */}
      <div className="flex items-center justify-center gap-1.5 mt-5 text-[13.5px] text-ink-700/80">
        <Icon icon="ph:clock-countdown" className="text-platinum-dim text-lg" />
        <span>Não recebeu?</span>
        <button 
          type="button"
          onClick={handleResend}
          disabled={countdown > 0}
          className={`font-medium transition-colors ${countdown > 0 ? 'text-platinum-dim cursor-not-allowed' : 'text-ink-900 hover:underline'}`}
        >
          {countdown > 0 ? `Reenviar em 0:${countdown.toString().padStart(2, '0')}` : 'Reenviar código'}
        </button>
      </div>

      {/* Reassurance Line */}
      <div className="flex items-center gap-1.5 mt-7 text-[12.5px] text-ink-700/60">
        <Icon icon="ph:lock-simple" className="text-sm" />
        <span>Criptografia de ponta-a-ponta. Nós nunca armazenamos seus códigos.</span>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {

  return (
    <div className="min-h-screen bg-paper font-sans text-ink-900 selection:bg-ink-900 selection:text-white flex flex-col items-center justify-center p-6 grain-veil">
      
      {/* Eyebrow Pill (Outside Card) */}
      <div className="animate-rise-1 inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white/70 dark:bg-paper2/70 px-3.5 py-1.5 shadow-sm mb-6">
        <Icon icon="ph:shield-check-fill" className="text-ink-900 text-sm" />
        <span className="text-[11.5px] uppercase font-semibold tracking-wider text-ink-700">
          Autenticação em duas etapas
        </span>
      </div>

      {/* Verify Glass Card */}
      <div className="animate-rise-2 w-full max-w-[440px] relative overflow-hidden rounded-[26px] border border-ink-900/10 bg-white/85 dark:bg-paper2/85 p-8 sm:p-10 shadow-card backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-rail"></div>
        <div className="absolute inset-x-0 top-[1px] h-[1px] bg-sheen"></div>
        <Suspense fallback={<div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink-900 border-t-transparent rounded-full animate-spin"></div></div>}>
          <VerifyOTPForm />
        </Suspense>
      </div>

      {/* Helper Links Row (Outside Card) */}
      <div className="animate-rise-3 flex items-center gap-4 mt-8 text-[12.5px] text-ink-700/70">
        <a href="/login" className="flex items-center gap-1 hover-underline">
          <Icon icon="ph:arrow-u-up-left" />
          Voltar para o login
        </a>
        <div className="w-[1px] h-3.5 bg-ink-900/15"></div>
        <Dialog>
          <DialogTrigger className="hover-underline cursor-pointer">
            Precisa de ajuda?
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">Precisa de ajuda com o código?</DialogTitle>
              <DialogDescription className="text-[14px] mt-2">
                Aqui estão algumas dicas caso não consiga acessar sua conta.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 py-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon="ph:envelope-simple" className="text-primary text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Verifique a caixa de spam</h4>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Às vezes, nosso e-mail com o código de 6 dígitos pode cair na lixeira, spam ou promoções. Procure por "Zebro" na barra de pesquisa.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon="ph:clock-clockwise" className="text-primary text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Código expirado</h4>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    O código tem validade de 24 horas. Se já passou desse tempo, clique em "Reenviar código" para receber um novo.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon="ph:headset" className="text-primary text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Suporte técnico</h4>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Ainda com problemas? Envie um e-mail para <a href="mailto:suporte@zebro.site" className="text-primary hover:underline font-medium">suporte@zebro.site</a> informando o seu e-mail cadastrado.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <button type="button" className="w-full py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors">
                  Entendi, vou tentar novamente
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
}
