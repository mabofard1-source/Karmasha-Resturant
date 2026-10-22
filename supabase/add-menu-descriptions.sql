-- Run this once in the Supabase SQL Editor before saving menu descriptions.
alter table public.menu_items
  add column if not exists description text not null default '';

notify pgrst, 'reload schema';
