create extension if not exists "uuid-ossp";

create table if not exists tables (
  id uuid primary key default uuid_generate_v4(),
  table_no int not null unique,
  is_active boolean not null default true
);

create table if not exists menu_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int not null default 0
);

create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  is_available boolean not null default true
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  table_id uuid not null references tables(id),
  status text not null check (status in ('pending', 'served', 'paid', 'canceled')),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  qty int not null check (qty > 0),
  note text
);

create table if not exists app_settings (
  id int primary key default 1,
  tax_percent numeric(5,2) not null default 0,
  restaurant_name text not null default 'Restaurant QR Order',
  updated_at timestamptz not null default now()
);

insert into app_settings (id, tax_percent)
values (1, 5)
on conflict (id) do nothing;

alter table tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table app_settings enable row level security;

create policy "Public menu category access"
on menu_categories for select
using (true);

create policy "Public menu access"
on menu_items for select
using (is_available = true);

create policy "Public order insert"
on orders for insert
to anon
with check (status = 'pending');

create policy "Public order item insert"
on order_items for insert
to anon
with check (qty > 0);

create policy "Admin full access orders"
on orders for all
to authenticated
using (true)
with check (true);

create policy "Admin full access menu"
on menu_items for all
to authenticated
using (true)
with check (true);

create policy "Admin full access categories"
on menu_categories for all
to authenticated
using (true)
with check (true);

create policy "Admin full access tables"
on tables for all
to authenticated
using (true)
with check (true);

create policy "Admin full access order items"
on order_items for all
to authenticated
using (true)
with check (true);

create policy "Public settings read"
on app_settings for select
using (true);

create policy "Admin settings update"
on app_settings for update
to authenticated
using (true)
with check (true);
