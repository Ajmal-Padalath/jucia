# Orange Flame Kitchen — QR Restaurant Ordering

Full-stack, responsive restaurant food ordering app. Customers scan a table QR code, browse the menu, customize items, place orders, and track status in real time — no account required.

## Tech Stack

- **Next.js 16** (App Router) + React 19
- **Tailwind CSS 4** + custom UI (Shadcn-style)
- **Prisma** + **SQLite** (local) / **PostgreSQL** (production via Docker)
- **NextAuth v5** (credentials for Admin / Kitchen / Waiter)
- **Zustand** (cart & favorites)
- **React Hook Form** + **Zod**
- **Socket.io** (real-time order updates)
- **Stripe** (optional online payment)
- **QRCode** + **jsPDF** (table QR PNG/PDF)

## Features

| Role | Capabilities |
|------|----------------|
| **Customer** | QR menu, search/filter, customize, cart, checkout, live order timeline, feedback, coupons |
| **Kitchen** | Live order cards, accept → prepare → ready → served |
| **Waiter** | Floor plan, table status, bills, mark served |
| **Admin** | Stats, menu CRUD, tables, QR codes, orders, reports/CSV |

## Quick Start

### 1. Install & seed (SQLite — no Docker needed)

```bash
npm install
npx prisma db push
npm run db:seed
```

### 2. Run (with Socket.io)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production PostgreSQL (optional)

```bash
docker compose up -d
```

Then set `DATABASE_URL` to your Postgres URL, switch `provider` in `prisma/schema.prisma` to `postgresql`, and re-run `db push` + seed.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | admin123 |
| Kitchen | kitchen@restaurant.com | admin123 |
| Waiter | waiter@restaurant.com | admin123 |

**Customer demo:** [http://localhost:3000/menu?table=1](http://localhost:3000/menu?table=1)

**Coupon codes:** `WELCOME10`, `FLAT5`

## Key Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/menu?table=1` | Customer digital menu |
| `/cart` | Shopping cart |
| `/checkout` | Place order |
| `/order/[id]` | Live order status |
| `/login` | Staff login |
| `/kitchen` | Kitchen dashboard |
| `/waiter` | Waiter floor plan |
| `/admin` | Admin overview |
| `/admin/menu` | Menu management |
| `/admin/tables` | Table management |
| `/admin/qr` | QR code PNG/PDF download |
| `/admin/orders` | Order management |
| `/admin/reports` | Reports + CSV export |

## Project Structure

```
src/
  app/
    menu/           # Customer digital menu
    cart/           # Shopping cart
    checkout/       # Place order + payment
    order/[id]/    # Live order status
    kitchen/        # Kitchen dashboard
    waiter/         # Floor / tables
    admin/          # Admin panels
    api/            # REST API routes
  components/       # UI + shared components
  store/            # Zustand stores
  lib/              # Auth, Prisma, validations, Stripe
  hooks/            # Socket provider
prisma/
  schema.prisma     # Full data model
  seed.ts           # Demo restaurant + menu
server.js           # Custom Next + Socket.io server
```

## API Overview

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Authentication |
| `/api/menu` | GET | Menu items (search/filter) |
| `/api/categories` | GET, POST | Categories |
| `/api/food-items` | GET, POST, PUT, DELETE | Menu CRUD |
| `/api/orders` | GET, POST, PATCH | Orders |
| `/api/tables` | GET, POST, PATCH, DELETE | Tables |
| `/api/qr` | GET, POST | QR generation |
| `/api/dashboard` | GET | Admin stats |
| `/api/reports` | GET | Reports + CSV |
| `/api/coupons/validate` | POST | Coupon check |
| `/api/feedback` | POST | Customer rating |

## QR Flow

Each table gets a unique URL:

```
https://your-domain.com/menu?table=12
```

Scanning saves the table in the cart session and opens the menu. No login required.

## Stripe (optional)

Set in `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Choosing **Online Payment** at checkout creates a Stripe Checkout session.

## Production Build

```bash
npm run build
npm start
```

Ensure `AUTH_SECRET`, `DATABASE_URL`, and `NEXT_PUBLIC_APP_URL` are set for your deployment host.

## License

MIT
