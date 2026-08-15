-- 1. Updates on Workspaces Table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS asaas_customer_id text,
ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_cycle_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS document_cpf_cnpj text;

-- 2. New Table: billing_invoices (Faturas e Histórico)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  asaas_payment_id text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL,
  due_date timestamp with time zone NOT NULL,
  payment_date timestamp with time zone,
  invoice_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. New Table: webhook_events (Auditoria Asaas)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS para as novas tabelas

-- Habilita RLS
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Políticas para billing_invoices
-- Usuários podem ver as faturas se forem membros do workspace
CREATE POLICY "Users can read invoices of their workspaces" ON public.billing_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = billing_invoices.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- O sistema backend (service_role) terá bypass RLS por padrão para Inserir/Atualizar faturas e eventos webhook.
-- Os usuários normais não podem alterar ou inserir faturas.

-- Políticas para webhook_events
-- Nenhum usuário comum pode ler ou escrever na tabela webhook_events.
-- Apenas o backend (service_role ou roles com super privilegios) pode inserir e ler.
-- Criamos uma política que sempre nega para usuários normais para garantir.
CREATE POLICY "Deny access to webhook_events for anon/authenticated" ON public.webhook_events
  FOR ALL USING (false);
