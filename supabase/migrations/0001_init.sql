-- 로그폴리오 초기 스키마 (MVP 범위: profiles/projects/logs/portfolios)
-- Supabase 대시보드 > SQL Editor에서 전체 붙여넣고 실행하세요.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  job text,
  year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  category text not null,
  content text not null,
  source text not null default 'manual' check (source in ('manual', 'github')),
  source_meta jsonb,
  created_at timestamptz not null default now()
);

create unique index logs_github_dedupe_idx
  on public.logs (project_id, (source_meta->>'sha'))
  where source = 'github';

create index logs_project_date_idx on public.logs (project_id, log_date);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_name text not null,
  content text not null,
  generation_source text not null default 'ai' check (generation_source in ('ai', 'local_fallback')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.logs enable row level security;
alter table public.portfolios enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "projects_all_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_all_own" on public.logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 포트폴리오는 select 정책을 분리한다: "내 목록"은 항상 소유자 기준으로만 조회되게 하고,
-- 공개 조회는 향후 공유 페이지에서 특정 id로만 사용한다 (목록 전체를 is_public으로 긁지 않음).
create policy "portfolios_select_own" on public.portfolios
  for select using (auth.uid() = user_id);
create policy "portfolios_select_public" on public.portfolios
  for select using (is_public = true);
create policy "portfolios_insert_own" on public.portfolios
  for insert with check (auth.uid() = user_id);
create policy "portfolios_update_own" on public.portfolios
  for update using (auth.uid() = user_id);
create policy "portfolios_delete_own" on public.portfolios
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
