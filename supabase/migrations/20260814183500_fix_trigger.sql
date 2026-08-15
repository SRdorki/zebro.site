create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_workspace_id uuid;
begin
  -- 1. Cria o profile do usuário
  insert into public.profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');

  -- 2. Cria um workspace padrão pro usuário
  insert into public.workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'name', 'Meu Workspace'),
    'workspace-' || substring(new.id::text from 1 for 8),
    new.id
  )
  returning id into new_workspace_id;

  -- 3. Adiciona o usuário como owner do workspace recém-criado
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'Owner');

  return new;
end;
$$ language plpgsql security definer;
