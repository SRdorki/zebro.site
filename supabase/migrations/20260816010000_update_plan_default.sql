-- Alter the default plan from 'free' to 'none' so new workspaces require explicit plan selection
ALTER TABLE public.workspaces ALTER COLUMN plan SET DEFAULT 'none';
