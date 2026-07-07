export type Role = "owner" | "manager" | "seller";
export type OrderOrigin = "online" | "whatsapp";
export type OrderStatus = "pendiente" | "confirmado" | "entregado" | "cancelado";
export type TaskStatus = "pendiente" | "hecha";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  sizes: string[];
  colors: string[];
  stock: number;
  active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  client_id: string | null;
  origin: OrderOrigin;
  status: OrderStatus;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
};

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
};

// Minimal hand-authored schema typing for the Supabase client.
// Regenerate with `npx supabase gen types typescript` once the project is linked
// if you want fully generated types instead.
// Note: these must stay `type` aliases, not `interface`s — TS won't consider an
// `interface` assignable to supabase-js's `Record<string, GenericTable>` constraint.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { name: string; price: number };
        Update: Partial<Product>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Partial<Client> & { name: string };
        Update: Partial<Client>;
        Relationships: [];
      };
      orders: {
        Row: Order & { clients?: Pick<Client, "name"> | null };
        Insert: Partial<Order> & { origin: OrderOrigin };
        Update: Partial<Order>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & {
          order_id: string;
          product_name: string;
        };
        Update: Partial<OrderItem>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { title: string };
        Update: Partial<Task>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
