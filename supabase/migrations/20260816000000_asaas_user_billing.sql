-- 1. Remove Asaas fields from workspaces if they exist
ALTER TABLE public.workspaces 
DROP COLUMN IF EXISTS asaas_customer_id,
DROP COLUMN IF EXISTS asaas_subscription_id,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_cycle_end,
DROP COLUMN IF EXISTS document_cpf_cnpj;

-- 2. Add Asaas fields to profiles (since billing is per user)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS asaas_customer_id text,
ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_cycle_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS document_cpf_cnpj text;

-- 3. Modify billing_invoices to reference profiles instead of workspaces
-- First drop the old foreign key constraint
ALTER TABLE public.billing_invoices 
DROP CONSTRAINT IF EXISTS billing_invoices_workspace_id_fkey;

-- Since the previous data might be inconsistent with the new schema, and we don't have production data yet, we can drop the workspace_id column and add user_id.
ALTER TABLE public.billing_invoices 
DROP COLUMN IF EXISTS workspace_id,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- We also need to recreate policies for billing_invoices, because we dropped workspace_id
DROP POLICY IF EXISTS "Users can read invoices of their workspaces" ON public.billing_invoices;

CREATE POLICY "Users can read their own invoices" ON public.billing_invoices
  FOR SELECT USING (auth.uid() = user_id);
