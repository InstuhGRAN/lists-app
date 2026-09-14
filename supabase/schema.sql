-- Run this in your Supabase project's SQL editor (Project > SQL Editor > New query).

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'custom' check (kind in ('travel', 'grocery', 'custom')),
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  label text not null,
  is_checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "Users manage their own lists"
  on public.lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage items in their own lists"
  on public.list_items for all
  using (exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid()))
  with check (exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid()));

-- Enable realtime so changes made on one device sync live to other devices.
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_items;
