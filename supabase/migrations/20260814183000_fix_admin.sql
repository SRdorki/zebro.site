DO $$
DECLARE
  new_workspace_id UUID;
  admin_id UUID := '0338eafe-ce26-42f9-a20d-a9aa19c4a4c7';
BEGIN
  -- Insert only if not exists
  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = admin_id) THEN
    INSERT INTO public.workspaces (name, slug)
    VALUES ('Vidora Admin', 'vidora-admin-' || substring(admin_id::text from 1 for 5))
    RETURNING id INTO new_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, admin_id, 'owner');
  END IF;
END $$;
