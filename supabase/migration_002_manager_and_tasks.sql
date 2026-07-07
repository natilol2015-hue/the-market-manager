-- Incremental migration: adds the "manager" role, profiles.email, and the
-- tasks (quehaceres) table. Run this once in the Supabase SQL editor —
-- you do NOT need to re-run the original schema.sql.

-- 1. Allow the new 'manager' role.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'manager', 'seller'));

-- 2. Add and backfill profiles.email (used to display teammates who never set a name).
alter table public.profiles add column if not exists email text;
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

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

-- 3. Helper for "owner or manager" checks.
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

-- 4. Let any signed-in user read all profiles (needed to show teammate names).
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (auth.uid() is not null);

-- 5. Managers get the same write/delete access as owners on products, clients and orders.
drop policy if exists "products_write_owner" on public.products;
create policy "products_write_owner" on public.products
  for insert with check (public.is_owner_or_manager());
drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner" on public.products
  for update using (public.is_owner_or_manager());
drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (public.is_owner_or_manager());

drop policy if exists "clients_delete_owner" on public.clients;
create policy "clients_delete_owner" on public.clients
  for delete using (public.is_owner_or_manager());

drop policy if exists "orders_delete_owner" on public.orders;
create policy "orders_delete_owner" on public.orders
  for delete using (public.is_owner_or_manager());

drop policy if exists "order_items_delete_owner" on public.order_items;
create policy "order_items_delete_owner" on public.order_items
  for delete using (public.is_owner_or_manager());

-- 6. Tasks (quehaceres) table.
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

alter table public.tasks enable row level security;

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

-- 7. After running this: promote your cousin to manager once he signs up:
--    update public.profiles set role = 'manager' where id =
--      (select id from auth.users where email = 'EMAIL_DEL_PRIMO_AQUI');
