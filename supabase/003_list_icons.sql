-- Run this after schema.sql and 002_list_themes.sql, in your Supabase project's SQL editor.
-- Adds a custom icon choice for Custom lists.

alter table public.lists add column if not exists icon text;
