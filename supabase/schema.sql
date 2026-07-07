-- The Market — schema + RLS policies
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'seller' check (role in ('owner', 'manager', 'seller')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row (default role: seller) whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helpers used inside RLS policies (security definer avoids recursive RLS on profiles).
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

create or replace function public.is_owner_or_manager()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('owner', 'manager')
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

-- ---------- tasks (quehaceres) ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  assigned_to uuid references public.profiles (id),
  status text not null default 'pendiente' check (status in ('pendiente', 'hecha')),
  due_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tasks enable row level security;

-- profiles: any signed-in user can read all profiles (needed to show teammate names,
-- e.g. who a task is assigned to); users can only edit their own row.
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- products: any signed-in user can view (needed to build an order); owners and
-- managers manage the catalog.
drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products
  for select using (auth.uid() is not null);

drop policy if exists "products_write_owner" on public.products;
create policy "products_write_owner" on public.products
  for insert with check (public.is_owner_or_manager());
drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner" on public.products
  for update using (public.is_owner_or_manager());
drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (public.is_owner_or_manager());

-- clients: everyone can view/create/edit; owners and managers delete.
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
  for delete using (public.is_owner_or_manager());

-- orders: everyone can view/create/edit (needed to manage pedidos); owners and
-- managers delete. Aggregate sales reporting (Resultados) is owner-only, enforced
-- in the app, not here, since sellers legitimately need to read individual orders.
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
  for delete using (public.is_owner_or_manager());

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
  for delete using (public.is_owner_or_manager());

-- tasks: everyone can view; owners/managers create, edit and delete any task;
-- anyone can update a task assigned to them (the app only lets them toggle status).
drop policy if exists "tasks_select_all" on public.tasks;
create policy "tasks_select_all" on public.tasks
  for select using (auth.uid() is not null);
drop policy if exists "tasks_insert_owner_manager" on public.tasks;
create policy "tasks_insert_owner_manager" on public.tasks
  for insert with check (public.is_owner_or_manager());
drop policy if exists "tasks_update_owner_manager_or_assignee" on public.tasks;
create policy "tasks_update_owner_manager_or_assignee" on public.tasks
  for update using (public.is_owner_or_manager() or assigned_to = auth.uid());
drop policy if exists "tasks_delete_owner_manager" on public.tasks;
create policy "tasks_delete_owner_manager" on public.tasks
  for delete using (public.is_owner_or_manager());

-- ---------- After running this file ----------
-- 1. Sign up the first user from the app's /login page.
-- 2. Promote that user to owner:
--    update public.profiles set role = 'owner' where id =
--      (select id from auth.users where email = 'PON_EL_EMAIL_AQUI');
-- 3. Promote someone to manager (e.g. gerente de ventas) the same way:
--    update public.profiles set role = 'manager' where id =
--      (select id from auth.users where email = 'PON_EL_EMAIL_AQUI');
