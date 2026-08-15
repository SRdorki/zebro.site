-- 1. Mudar o plano padrão para 'free'
ALTER TABLE public.workspaces ALTER COLUMN plan SET DEFAULT 'free';

-- Se quiser, podemos atualizar contas sem vídeos para free, mas vamos deixar como estão.

-- 2. Ativar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Agendar tarefa diária (Meia-noite) para deletar vídeos do plano free com mais de 14 dias
-- Nota: Isso deleta o registro do banco. A remoção do arquivo físico no Storage (S3) precisará de um Edge Function ou rotina Node.js complementar.
SELECT cron.schedule('delete_free_videos_14_days', '0 0 * * *', $$
  DELETE FROM public.videos 
  WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE plan = 'free') 
  AND created_at < NOW() - INTERVAL '14 days';
$$);
