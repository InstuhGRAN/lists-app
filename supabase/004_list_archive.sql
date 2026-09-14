-- Run this after schema.sql, 002_list_themes.sql, and 003_list_icons.sql,
-- in your Supabase project's SQL editor.
-- Adds soft-delete (archive) support for lists.

alter table public.lists add column if not exists archived_at timestamptz;
