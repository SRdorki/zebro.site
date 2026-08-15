-- Super Migration: Fases 3 a 10

-- PROJECTS
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PLAYLISTS
create table public.playlists (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  thumbnail_url text,
  privacy text check (privacy in ('PUBLIC', 'UNLISTED', 'PRIVATE')) default 'PRIVATE' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PLAYLIST_VIDEOS
create table public.playlist_videos (
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  position integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (playlist_id, video_id)
);

-- DOMAINS
create table public.domains (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  domain text not null,
  status text check (status in ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED')) default 'PENDING' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API KEYS
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  key_hash text not null,
  last_used_at timestamp with time zone,
  status text check (status in ('ACTIVE', 'REVOKED')) default 'ACTIVE' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WORKSPACE INVITES
create table public.workspace_invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text check (role in ('Admin', 'Editor', 'Viewer')) not null,
  status text check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')) default 'PENDING' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANALYTICS (Daily Stats)
create table public.daily_video_stats (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  date date not null,
  views integer default 0,
  watch_time_seconds bigint default 0,
  unique(video_id, date)
);

-- RLS
alter table public.projects enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_videos enable row level security;
alter table public.domains enable row level security;
alter table public.api_keys enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.daily_video_stats enable row level security;

-- Simple generic RLS for ALL these tables (User must be member of workspace)
create policy "Workspace member access for projects" on public.projects
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = projects.workspace_id and workspace_members.user_id = auth.uid()));

create policy "Workspace member access for playlists" on public.playlists
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = playlists.workspace_id and workspace_members.user_id = auth.uid()));

create policy "Workspace member access for playlist_videos" on public.playlist_videos
  for all using (exists (select 1 from public.playlists p join public.workspace_members wm on p.workspace_id = wm.workspace_id where p.id = playlist_videos.playlist_id and wm.user_id = auth.uid()));

create policy "Workspace member access for domains" on public.domains
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = domains.workspace_id and workspace_members.user_id = auth.uid()));

create policy "Workspace member access for api_keys" on public.api_keys
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = api_keys.workspace_id and workspace_members.user_id = auth.uid()));

create policy "Workspace member access for invites" on public.workspace_invites
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = workspace_invites.workspace_id and workspace_members.user_id = auth.uid()));

create policy "Workspace member access for daily_video_stats" on public.daily_video_stats
  for all using (exists (select 1 from public.workspace_members where workspace_members.workspace_id = daily_video_stats.workspace_id and workspace_members.user_id = auth.uid()));
