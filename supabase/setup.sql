-- Run once in the Supabase SQL Editor for the Karmasha project.
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  section_title text not null,
  price numeric(10, 2),
  image_url text,
  art_key text not null default 'sandwiches',
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;

drop policy if exists "Public can read available menu items" on public.menu_items;
create policy "Public can read available menu items"
  on public.menu_items for select
  to anon, authenticated
  using (is_available = true);

drop policy if exists "Karmasha admin can manage menu items" on public.menu_items;
create policy "Karmasha admin can manage menu items"
  on public.menu_items for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'mabofard1@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'mabofard1@gmail.com');
