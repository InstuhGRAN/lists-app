-- Run this after schema.sql, in your Supabase project's SQL editor.
-- Adds per-list background color / photo support.

alter table public.lists add column if not exists background_color text;
alter table public.lists add column if not exists background_image_path text;

-- Bucket to hold list background photos. Public read (so image URLs work
-- directly in <Image>), writes restricted to the owning user's folder.
insert into storage.buckets (id, name, public)
values ('list-backgrounds', 'list-backgrounds', true)
on conflict (id) do nothing;

create policy "Public read access to list backgrounds"
  on storage.objects for select
  using (bucket_id = 'list-backgrounds');

create policy "Users upload their own list backgrounds"
  on storage.objects for insert
  with check (bucket_id = 'list-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own list backgrounds"
  on storage.objects for update
  using (bucket_id = 'list-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own list backgrounds"
  on storage.objects for delete
  using (bucket_id = 'list-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
