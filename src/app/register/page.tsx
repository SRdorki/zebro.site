import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string, success?: string, email?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const isSuccess = searchParams.success === 'true';
  const registeredEmail = searchParams.email;

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 w-full max-w-md p-6">
          <div className="backdrop-blur-2xl bg-card/60 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative text-center p-8 sm:p-10">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight mb-3">Verifique seu e-mail</h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
              Enviamos um link de confirmação para <br />
              <strong className="text-foreground font-semibold">{registeredEmail || 'seu e-mail'}</strong>. <br />
              Por favor, clique no link para ativar sua conta.
            </p>

            <Link href="/login">
              <Button className="w-full h-12 rounded-xl text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all">
                Ir para o Login
              </Button>
            </Link>

            <p className="text-[13px] text-muted-foreground mt-6">
              Não recebeu? Verifique sua caixa de spam ou lixeira.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="backdrop-blur-2xl bg-card/60 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
          
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center space-y-3 text-center mb-8">
              <div className="mb-2 transition-transform hover:scale-105 duration-300">
                <img src="/logo.svg" alt="Zebro Logo" className="h-16 w-auto drop-shadow-xl" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Criar uma conta</h1>
              <p className="text-sm text-muted-foreground">
                Comece gratuitamente a usar o Zebro
              </p>
            </div>

            <form action={signup} className="space-y-5">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-start gap-2">
                  <span className="font-semibold text-destructive">Erro:</span> {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                    <Input 
                      id="name" 
                      name="name" 
                      type="text" 
                      placeholder="Seu nome" 
                      required 
                      className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="m@exemplo.com" 
                      required 
                      className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      className="pl-10 h-12 rounded-xl bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-12 rounded-xl text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group">
                  Criar conta agora
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
