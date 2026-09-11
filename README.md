# Pritam's — "The Taste of Indian Household"

A production-ready e-commerce website for Pritam's homemade achaar, built with
Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Postgres) and
Razorpay.

This is a real, working application — not a mockup. Follow the steps below to
connect it to a real database and payment gateway and deploy it.

---

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values as described below.

## 3. Set up Supabase (database + auth)

1. Create a free project at https://supabase.com.
2. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
3. Go to the **SQL Editor**, open `supabase/schema.sql` from this repo, paste
   its full contents in, and run it. This creates every table (`products`,
   `product_images`, `inventory`, `inventory_history`, `customers`, `orders`,
   `order_items`, `payments`, `admin_users`, `settings`), the atomic
   inventory functions, Row Level Security policies, and seeds the four
   starter products (Aam / Nimbu / Mirch / Mix Achaar) with placeholder
   prices — **edit these from the Admin Dashboard** once you're logged in.

### Why inventory can't be oversold

Two people can never successfully buy the last jar at the same time: stock is
only ever deducted inside the `commit_order_inventory()` Postgres function,
which row-locks the `inventory` row (`SELECT ... FOR UPDATE`) inside a single
transaction. If two payments try to commit at once, the second one to reach
the lock sees the already-updated quantity and fails safely — the order is
cancelled and the customer is told the item just sold out.

## 4. Create your first admin account

1. In Supabase, go to **Authentication → Users → Add User** and create a
   user with your email + a password (or use "Invite").
2. Copy that user's UUID.
3. In the **SQL Editor**, run:
   ```sql
   insert into admin_users (id, full_name, role)
   values ('PASTE-USER-UUID-HERE', 'Your Name', 'owner');
   ```
4. Go to `/admin/login` on your site and sign in.

To add a second admin/staff member later, repeat this with their user UUID.

## 5. Configure Razorpay (online payments)

1. Create an account at https://razorpay.com and complete KYC when you're
   ready to accept real payments (you can build/test with **Test Mode** keys
   first).
2. Go to **Settings → API Keys**, generate a key pair, and set:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Go to **Settings → Webhooks**, add a webhook pointing to:
   `https://your-domain.com/api/webhooks/razorpay`
   Subscribe to at least: `payment.captured`, `payment.failed`, `order.paid`.
   Copy the generated secret into `RAZORPAY_WEBHOOK_SECRET`.

Payments are verified **twice**, independently:
- Client-side: `/api/payment/verify` checks the Razorpay signature returned
  to the browser after checkout, for a fast confirmation page.
- Server-side (source of truth): the webhook at `/api/webhooks/razorpay`
  verifies the event signature and finalizes the order even if the customer
  closes their browser tab before the client-side call fires.

Both paths call the same idempotent `finalizePaidOrder()` logic, so a
webhook retry or duplicate callback can never double-charge inventory or
mark an order paid twice (`payments.gateway_payment_id` is a unique column).

### Testing payments safely
Use Razorpay's **Test Mode** keys and their documented test card / UPI
credentials (see Razorpay docs → Test Card Numbers) — no real money moves.
Only switch to live keys once you're ready to launch.

## 6. Run locally

```bash
npm run dev
```
Visit http://localhost:3000. Visit http://localhost:3000/admin/login to sign in
as admin.

## 7. Add / edit products

Go to **Admin → Products**:
- Click **+ Add New Product** to create a new item (starts as "Draft").
- Add its photo to `/public/products/your-photo.jpg` (or host it elsewhere
  and paste the URL), then set the product's status to **Active** once
  ready — only Active products appear on the storefront.
- Edit name/price inline; click outside the field to save.

## 8. Change inventory

Still on **Admin → Products**, use the **+ Add / − Sub / Set** controls next
to each product, or **Mark Sold Out**. Every manual change is logged in
`inventory_history` for a full audit trail. Low-stock threshold (used for the
"Only X jars left" badge) is configurable per product via the database, and a
site-wide default lives in **Admin → Settings**.

## 9. Enable Cash on Delivery

**Admin → Settings → Cash on Delivery** toggle. It's OFF by default — while
off, customers only see the online payment option at checkout. Turning it ON
also lets you set a COD fee and a maximum COD order value.

## 10. Deploy

The easiest path is [Vercel](https://vercel.com) (built by the makers of
Next.js):

1. Push this project to a GitHub repository.
2. Import the repo in Vercel.
3. Add all the environment variables from `.env.example` in
   **Project Settings → Environment Variables**.
4. Deploy.

Any other Node.js hosting that supports Next.js (Netlify, Render, your own
server via `npm run build && npm run start`) will also work.

## 11. Configure your domain

In Vercel: **Project → Settings → Domains** → add your domain and follow the
DNS instructions (usually a CNAME or A record with your registrar). Once
live, update `NEXT_PUBLIC_SITE_URL` to your real domain and redeploy so SEO
tags, the sitemap, and Razorpay webhook URLs match your production URL.

---

## Project structure

```
src/
  app/                 Pages (App Router) + API routes
    api/
      orders/create     Creates a pending order (server-verified price & stock)
      payment/create     Opens a Razorpay order for that order's exact total
      payment/verify      Client-side signature verification (fast path)
      webhooks/razorpay    Server-to-server webhook (source of truth)
      admin/*              Admin-only inventory/order/product mutations
    admin/               Admin Dashboard (protected by middleware.ts)
    product/[slug]        Product detail pages
    ...                    Shop, cart, checkout, order-success, policy pages
  components/            Navbar, Footer, ProductCard, CartDrawer, etc.
  lib/
    supabase/             client.ts (browser), server.ts (session-aware),
                          admin.ts (service-role, server-only)
    cart-context.tsx       Cart UI state (localStorage) — NOT the source of
                          truth for price/stock, only for convenience
    validation/checkout.ts  Zod schema incl. Indian phone/PIN code validation
supabase/schema.sql       Full database schema, RLS policies, atomic
                          inventory functions, and starter product seed data
```

## Security notes

- Product price and stock are **always** re-read from the database inside
  `/api/orders/create` — values sent from the browser are never trusted.
- The Supabase **service role key** (full read/write, bypasses Row Level
  Security) is only ever used inside server-only files (`lib/supabase/admin.ts`,
  marked with `import "server-only"`) and API routes — never in client code.
- Admin routes are protected twice: `middleware.ts` requires a logged-in
  Supabase session, and every admin API route additionally checks the user
  exists in `admin_users` before allowing a write.
- No card numbers, CVVs, or UPI PINs ever touch this application's database —
  Razorpay Checkout collects those directly.
