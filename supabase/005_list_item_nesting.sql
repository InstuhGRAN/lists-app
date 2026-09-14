-- Run this after the previous migrations, in your Supabase project's SQL editor.
-- Adds one level of nesting (sub-items) for list items.

alter table public.list_items
  add column if not exists parent_item_id uuid references public.list_items (id) on delete cascade;
