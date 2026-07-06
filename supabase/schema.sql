-- The Market — schema + RLS policies
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'seller' check (role in ('owner', 'seller')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row (default role: seller) whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used inside RLS policies (security definer avoids recursive RLS on profiles).
create or replace function public.is_owner()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price numeric(10, 2) not null default 0,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id),
  origin text not null check (origin in ('online', 'whatsapp')),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total numeric(10, 2) not null default 0,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null default 0,
  size text,
  color text
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: everyone reads their own row; owners read all (needed to show a "team" list later).
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
create policy "profiles_select_own_or_owner" on public.profiles
  for select using (id = auth.uid() or public.is_owner());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- products: any signed-in user can view (needed to build an order); only owners manage the catalog.
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (auth.uid() is not null);

drop policy if exists "products_write_owner" on public.products;
create policy "products_write_owner" on public.products
  for insert with check (public.is_owner());
drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner" on public.products
  for update using (public.is_owner());
drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (public.is_owner());

-- clients: both roles can view/create/edit; only owners delete.
drop policy if exists "clients_select_all" on public.clients;
create policy "clients_select_all" on public.clients
  for select using (auth.uid() is not null);
drop policy if exists "clients_insert_all" on public.clients;
create policy "clients_insert_all" on public.clients
  for insert with check (auth.uid() is not null);
drop policy if exists "clients_update_all" on public.clients;
create policy "clients_update_all" on public.clients
  for update using (auth.uid() is not null);
drop policy if exists "clients_delete_owner" on public.clients;
create policy "clients_delete_owner" on public.clients
  for delete using (public.is_owner());

-- orders: both roles can view/create/edit (needed to manage pedidos); only owners delete.
-- Aggregate sales reporting is enforced in the app (owner-only dashboard route), not here,
-- since sellers legitimately need to read individual orders to do their job.
drop policy if exists "orders_select_all" on public.orders;
create policy "orders_select_all" on public.orders
  for select using (auth.uid() is not null);
drop policy if exists "orders_insert_all" on public.orders;
create policy "orders_insert_all" on public.orders
  for insert with check (auth.uid() is not null);
drop policy if exists "orders_update_all" on public.orders;
create policy "orders_update_all" on public.orders
  for update using (auth.uid() is not null);
drop policy if exists "orders_delete_owner" on public.orders;
create policy "orders_delete_owner" on public.orders
  for delete using (public.is_owner());

-- order_items: follow the parent order's access.
drop policy if exists "order_items_select_all" on public.order_items;
create policy "order_items_select_all" on public.order_items
  for select using (auth.uid() is not null);
drop policy if exists "order_items_insert_all" on public.order_items;
create policy "order_items_insert_all" on public.order_items
  for insert with check (auth.uid() is not null);
drop policy if exists "order_items_update_all" on public.order_items;
create policy "order_items_update_all" on public.order_items
  for update using (auth.uid() is not null);
drop policy if exists "order_items_delete_owner" on public.order_items;
create policy "order_items_delete_owner" on public.order_items
  for delete using (public.is_owner());

-- ---------- After running this file ----------
-- 1. Sign up the first user from the app's /login page.
-- 2. Promote that user to owner:
--    update public.profiles set role = 'owner' where id =
--      (select id from auth.users where email = 'PON_EL_EMAIL_AQUI');
