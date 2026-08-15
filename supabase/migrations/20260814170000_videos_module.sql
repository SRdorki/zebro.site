create table public.videos (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('QUEUED', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED')) default 'QUEUED' not null,
  privacy text check (privacy in ('PUBLIC', 'UNLISTED', 'PRIVATE', 'PASSWORD')) default 'PRIVATE' not null,
  file_path text,
  size_bytes bigint,
  duration numeric,
  resolution text,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.videos enable row level security;

create policy "Users can see videos in their workspaces" on public.videos
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = videos.workspace_id
      and wm.user_id = auth.uid()
    )
  );

create policy "Users can insert videos in their workspaces" on public.videos
  for insert with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = videos.workspace_id
      and wm.user_id = auth.uid()
    )
  );

create policy "Users can update videos in their workspaces" on public.videos
  for update using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = videos.workspace_id
      and wm.user_id = auth.uid()
    )
  );

create policy "Users can delete videos in their workspaces" on public.videos
  for delete using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = videos.workspace_id
      and wm.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public) 
values ('videos_bucket', 'videos_bucket', false)
on conflict (id) do nothing;

create policy "Users can upload to their workspace folder" on storage.objects
  for insert with check (
    bucket_id = 'videos_bucket' and 
    auth.uid() is not null
  );

create policy "Users can read from videos_bucket" on storage.objects
  for select using (
    bucket_id = 'videos_bucket'
  );

create policy "Users can update their videos in videos_bucket" on storage.objects
  for update using (
    bucket_id = 'videos_bucket' and auth.uid() is not null
  );

create policy "Users can delete their videos in videos_bucket" on storage.objects
  for delete using (
    bucket_id = 'videos_bucket' and auth.uid() is not null
  );
