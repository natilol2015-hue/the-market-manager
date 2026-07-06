# Poner en marcha The Market — Panel de gestión

Esta guía te lleva paso a paso para dejar la app funcionando en internet, sin
necesitar conocimientos técnicos.

## 1. Crear el proyecto en Supabase (base de datos + login)

1. Andá a [supabase.com](https://supabase.com) y creá una cuenta gratis.
2. Creá un proyecto nuevo (elegí cualquier nombre y una contraseña de base de
   datos, guardala en un lugar seguro).
3. Una vez creado, andá a **SQL Editor** → **New query**, pegá todo el
   contenido del archivo [`supabase/schema.sql`](supabase/schema.sql) de este
   proyecto, y hacé click en **Run**. Esto crea todas las tablas y los
   permisos.
4. Andá a **Project Settings → API**. Ahí vas a ver:
   - **Project URL** → esto es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → esto es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Crear los usuarios (dueños y vendedoras)

1. En Supabase, andá a **Authentication → Users → Add user**.
2. Creá una cuenta para cada persona (email + contraseña). Por defecto todas
   quedan como "vendedora" (rol `seller`).
3. Para convertir a alguien en dueño, andá a **SQL Editor** y corré (cambiando
   el email):

   ```sql
   update public.profiles set role = 'owner'
   where id = (select id from auth.users where email = 'mama@ejemplo.com');
   ```

## 3. Probarlo en tu computadora (opcional)

1. Copiá `.env.local.example` a `.env.local` y completá con los dos valores
   del paso 1.
2. Instalá dependencias y corré:

   ```bash
   npm install
   npm run dev
   ```
3. Abrí `http://localhost:3000` y entrá con uno de los usuarios que creaste.

## 4. Publicarlo en internet (Vercel)

1. Subí este proyecto a un repositorio de GitHub (puede ser privado).
2. Andá a [vercel.com](https://vercel.com), creá una cuenta gratis con GitHub,
   y hacé click en **Add New → Project**, eligiendo este repositorio.
3. En **Environment Variables**, agregá:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (los mismos valores del paso 1).
4. Hacé click en **Deploy**. En un par de minutos vas a tener una URL como
   `https://the-market-manager.vercel.app` que podés abrir desde el celular o
   la computadora de cualquiera de las dos.

## Qué puede ver cada rol

- **Dueños**: Resultados (total vendido, desglose online/WhatsApp, productos
  más vendidos), Pedidos, Clientes y Catálogo.
- **Vendedoras**: Pedidos y Clientes. Pueden cargar pedidos eligiendo
  productos del catálogo, pero no ven resultados ni pueden editar el catálogo.

## Cargar el catálogo

Antes de cargar pedidos, un dueño tiene que entrar a **Catálogo** y cargar los
productos (nombre, precio, talles, colores, stock). Los pedidos solo permiten
elegir productos que ya estén cargados ahí.
