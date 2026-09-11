-- =====================================================================
-- PRITAM'S ACHAAR — DATABASE SCHEMA (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,                 -- e.g. 'aam-achaar'
  name text not null,                        -- e.g. 'Aam Achaar'
  short_description text,
  description text,
  ingredients text,                          -- free text, comma separated
  spice_level text check (spice_level in ('mild','medium','hot','extra_hot')) default 'medium',
  weight_grams integer,                      -- e.g. 400
  price_paise integer not null default 0,    -- store money in paise (integer) to avoid float errors
  compare_at_price_paise integer,            -- optional "was" price for discounts
  max_qty_per_order integer default 10,
  status text check (status in ('draft','active','archived')) default 'draft',
  is_featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- INVENTORY  (single source of truth for stock; never trust client)
-- ---------------------------------------------------------------------
create table if not exists inventory (
  product_id uuid primary key references products(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0), -- held during checkout in-flight
  low_stock_threshold integer not null default 5,
  is_sold_out boolean generated always as (quantity_available <= 0) stored,
  updated_at timestamptz default now()
);

create table if not exists inventory_history (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  change integer not null,               -- +ve = restock, -ve = deduction
  reason text not null,                  -- 'order_paid','order_cancelled','manual_admin','restock'
  order_id uuid,
  admin_user_id uuid,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,          -- human friendly e.g. PRT-100234
  customer_id uuid references customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,

  subtotal_paise integer not null,
  shipping_paise integer not null default 0,
  cod_fee_paise integer not null default 0,
  total_paise integer not null,

  payment_method text check (payment_method in ('online','cod')) not null default 'online',
  payment_status text check (payment_status in ('pending','paid','failed','refunded')) not null default 'pending',
  order_status text check (order_status in (
    'pending','paid','processing','packed','shipped','delivered','cancelled','refunded'
  )) not null default 'pending',

  inventory_committed boolean not null default false, -- true only after stock has actually been deducted

  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,       -- snapshot at time of order
  unit_price_paise integer not null, -- snapshot — server price, never trust client
  quantity integer not null check (quantity > 0),
  line_total_paise integer not null
);

-- ---------------------------------------------------------------------
-- PAYMENTS  (raw gateway events for audit trail / idempotency)
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  gateway text not null default 'razorpay',
  gateway_order_id text,
  gateway_payment_id text unique,     -- unique -> guarantees idempotent webhook processing
  gateway_event_id text unique,       -- Razorpay webhook event id, for duplicate-retry protection
  status text not null,               -- 'created','authorized','captured','failed'
  amount_paise integer not null,
  raw_payload jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- ADMIN USERS
-- Admin auth is handled by Supabase Auth (email+password / magic link).
-- This table just maps an auth.users id to admin role/permissions.
-- ---------------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('owner','staff')) default 'staff',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- SETTINGS  (single-row key/value style config editable from admin)
-- ---------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('store_name', '"Pritam''s"'),
  ('store_tagline', '"The Taste of Indian Household"'),
  ('whatsapp_number', '"916280060371"'),
  ('currency', '"INR"'),
  ('shipping_charge_paise', '6000'),
  ('free_shipping_threshold_paise', '99900'),
  ('cod_enabled', 'false'),
  ('cod_fee_paise', '0'),
  ('cod_max_order_paise', '200000'),
  ('low_stock_threshold_default', '5'),
  ('estimated_delivery_days', '"4-6 business days"'),
  ('store_available', 'true')
on conflict (key) do nothing;

-- =====================================================================
-- ATOMIC INVENTORY FUNCTIONS
-- These run inside a single DB transaction so two simultaneous orders
-- can never both succeed for the last unit ("no overselling").
-- =====================================================================

-- Attempt to deduct stock for a paid order. Raises an exception (and the
-- whole transaction rolls back) if insufficient stock exists for ANY item.
create or replace function commit_order_inventory(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  item record;
  available integer;
begin
  -- lock the relevant inventory rows first, in a stable order, to avoid deadlocks
  for item in
    select oi.product_id, oi.quantity
    from order_items oi
    where oi.order_id = p_order_id
    order by oi.product_id
  loop
    select quantity_available into available
    from inventory
    where product_id = item.product_id
    for update; -- row lock

    if available is null or available < item.quantity then
      raise exception 'insufficient_stock_for_product_%', item.product_id;
    end if;

    update inventory
      set quantity_available = quantity_available - item.quantity,
          updated_at = now()
      where product_id = item.product_id;

    insert into inventory_history (product_id, change, reason, order_id)
      values (item.product_id, -item.quantity, 'order_paid', p_order_id);
  end loop;

  update orders set inventory_committed = true, updated_at = now() where id = p_order_id;
end;
$$;

-- Restore stock for a cancelled/refunded order (only if it was committed).
create or replace function restore_order_inventory(p_order_id uuid, p_reason text default 'order_cancelled')
returns void
language plpgsql
as $$
declare
  item record;
  was_committed boolean;
begin
  select inventory_committed into was_committed from orders where id = p_order_id;
  if not coalesce(was_committed, false) then
    return; -- nothing to restore, stock was never deducted
  end if;

  for item in
    select oi.product_id, oi.quantity
    from order_items oi
    where oi.order_id = p_order_id
    order by oi.product_id
  loop
    update inventory
      set quantity_available = quantity_available + item.quantity,
          updated_at = now()
      where product_id = item.product_id;

    insert into inventory_history (product_id, change, reason, order_id)
      values (item.product_id, item.quantity, p_reason, p_order_id);
  end loop;

  update orders set inventory_committed = false, updated_at = now() where id = p_order_id;
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Public (anon) role: read-only access to active products/images/settings.
-- Everything else (orders, customers, payments, inventory writes, admin)
-- is only reachable via the server (service-role key) inside API routes.
-- =====================================================================

alter table products enable row level security;
alter table product_images enable row level security;
alter table inventory enable row level security;
alter table inventory_history enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table admin_users enable row level security;
alter table settings enable row level security;

create policy "public read active products" on products
  for select using (status = 'active');

create policy "public read product images" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_images.product_id and p.status = 'active')
  );

create policy "public read stock counts" on inventory
  for select using (true);

create policy "public read settings" on settings
  for select using (true);

-- Admins (authenticated users present in admin_users) get full access to everything,
-- enforced via Supabase Auth session on the admin dashboard routes.
create policy "admins full access products" on products for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access images" on product_images for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access inventory" on inventory for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access inv history" on inventory_history for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access customers" on customers for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access orders" on orders for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access order items" on order_items for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access payments" on payments for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins full access settings" on settings for all
  using (exists (select 1 from admin_users a where a.id = auth.uid()));
create policy "admins can see admin_users" on admin_users for select
  using (exists (select 1 from admin_users a where a.id = auth.uid()));

-- Note: order creation & payment writes happen server-side using the
-- Supabase SERVICE ROLE key (bypasses RLS by design) inside /api routes —
-- never from the browser. This is what prevents customers from tampering
-- with prices, stock, or order/payment status.

-- =====================================================================
-- SEED: four starter products (Aam / Nimbu / Mirch / Mix Achaar)
-- Prices/weights are PLACEHOLDERS — edit in Admin → Products.
-- =====================================================================
insert into products (slug, name, short_description, description, ingredients, spice_level, weight_grams, price_paise, max_qty_per_order, status, is_featured, sort_order)
values
  ('aam-achaar', 'Aam Achaar', 'Tangy raw mango pickle, made the traditional way.', 'Placeholder description — replace with your own story about how this achaar is made at home.', 'Placeholder — e.g. raw mango, mustard oil, spices (edit in admin)', 'medium', 400, 24900, 10, 'active', true, 1),
  ('nimbu-achaar', 'Nimbu Achaar', 'Classic sun-pickled lemon achaar.', 'Placeholder description — replace with your own story about how this achaar is made at home.', 'Placeholder — e.g. lemon, salt, spices (edit in admin)', 'mild', 400, 22900, 10, 'active', true, 2),
  ('mirch-achaar', 'Mirch Achaar', 'Fiery green chilli achaar with mustard.', 'Placeholder description — replace with your own story about how this achaar is made at home.', 'Placeholder — e.g. green chilli, mustard, spices (edit in admin)', 'hot', 350, 24900, 10, 'active', true, 3),
  ('mix-achaar', 'Mix Achaar', 'A homely blend of seasonal vegetables.', 'Placeholder description — replace with your own story about how this achaar is made at home.', 'Placeholder — e.g. mixed vegetables, mustard oil, spices (edit in admin)', 'medium', 400, 26900, 10, 'active', true, 4)
on conflict (slug) do nothing;

insert into inventory (product_id, quantity_available, low_stock_threshold)
select id, 20, 5 from products where slug in ('aam-achaar','nimbu-achaar','mirch-achaar','mix-achaar')
on conflict (product_id) do nothing;

insert into product_images (product_id, url, alt_text, sort_order)
select id, '/products/' || slug || '.jpg', name, 1
from products where slug in ('aam-achaar','nimbu-achaar','mirch-achaar','mix-achaar')
on conflict do nothing;
