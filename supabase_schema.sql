-- ============================================================
-- Vintia — Schema Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Active Row Level Security sur toutes les tables (chaque user ne voit que ses données)

-- ── 1. Profils utilisateur ──────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  avatar_url  text,
  avatar_initials text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can manage own profile"
  on public.user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── 2. Plateformes ──────────────────────────────────────────────────────────
create table if not exists public.platforms (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null,
  icon         text not null default 'storefront',
  accent_color text not null default '#D79A2A',
  url          text,
  connected    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.platforms enable row level security;

create policy "Users can manage own platforms"
  on public.platforms for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists platforms_user_id_idx on public.platforms(user_id);

-- ── 3. Articles ─────────────────────────────────────────────────────────────
create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  platform_id     uuid references public.platforms(id) on delete set null,
  transaction     text not null check (transaction in ('achat','vente','attente','perdu')),
  type            text not null default 'autre',
  titre           text not null default '',
  url             text not null default '',
  description     text not null default '',
  prix_achat      numeric,
  prix_vente      numeric,
  prix_vendu      numeric,
  marge           numeric,
  prix_ia_cible   numeric,
  recommandations text not null default '',
  analyse_ia      text,
  compare_avec    uuid[] not null default '{}',
  date_ajout      timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Users can manage own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists items_user_id_idx on public.items(user_id);
create index if not exists items_platform_id_idx on public.items(platform_id);

-- ── 4. Paramètres IA ────────────────────────────────────────────────────────
create table if not exists public.ai_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  provider      text not null default 'gemini',
  api_key       text not null default '',
  model         text not null default 'gemini-2.5-flash',
  fallback_keys jsonb not null default '[]',
  updated_at    timestamptz not null default now()
);

alter table public.ai_settings enable row level security;

create policy "Users can manage own AI settings"
  on public.ai_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 5. Cache recommandations quotidiennes ───────────────────────────────────
create table if not exists public.daily_recommendations (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  text         text not null,
  generated_at timestamptz not null default now(),
  expires_at   timestamptz not null
);

alter table public.daily_recommendations enable row level security;

create policy "Users can manage own daily recommendations"
  on public.daily_recommendations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Trigger : créer le profil + ai_settings automatiquement à l'inscription ─
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, name, email, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_initials', '')
  );

  insert into public.ai_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
