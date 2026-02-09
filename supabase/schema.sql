create extension if not exists "uuid-ossp";

create table public.tables (
  id uuid primary key default uuid_generate_v4(),
  table_no int not null unique,
  is_active boolean default true,
  created_at timestamp default now()
);

create table public.menu_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int default 0,
  created_at timestamp default now()
);

create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.menu_categories(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  is_available boolean default true,
  image_url text,
  created_at timestamp default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  table_id uuid references public.tables(id),
  status text default 'pending',
  created_at timestamp default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id),
  qty int not null check (qty > 0),
  note text
);

alter table tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public read menu categories"
on menu_categories for select
using (true);

create policy "Public read menu items"
on menu_items for select
using (is_available = true);

create policy "Public read tables"
on tables for select
using (is_active = true);

create policy "Public create orders"
on orders for insert
with check (true);

create policy "Public insert order items"
on order_items for insert
with check (true);

create policy "Public read orders"
on orders for select
using (true);

create policy "Public read order items"
on order_items for select
using (true);

create policy "Admin full access tables"
on tables for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admin full access menu"
on menu_items for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admin full access categories"
on menu_categories for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Admin manage orders"
on orders for update
using (auth.role() = 'authenticated');

create policy "Admin manage order items"
on order_items for update
using (auth.role() = 'authenticated');

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
