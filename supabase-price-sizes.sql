alter table public.menu_items
  add column if not exists price_m numeric(10, 2),
  add column if not exists price_l numeric(10, 2);

-- Keep existing single-price items visible as M until you edit them.
update public.menu_items
set price_m = price
where price_m is null and price is not null;

notify pgrst, 'reload schema';
