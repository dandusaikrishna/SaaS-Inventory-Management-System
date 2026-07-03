# StockFlow MVP

StockFlow is a minimal multi-tenant SaaS inventory management application built for demo and internal use. A user can sign up, create an organization, manage products with SKU and quantity tracking, view a dashboard with inventory summaries and low-stock alerts, and configure organization-wide defaults.

This implementation targets the **Phase 1 – 6-Hour MVP** scope: single user per organization, no integrations, no purchase orders, and no advanced reporting.

---

## Features

### Authentication & tenancy
- Email/password signup with organization name
- Login and logout with JWT stored in an HTTP-only cookie
- All product and settings data scoped by organization

### Product management
- Create, read, update, and delete products
- Fields: name, SKU, description, quantity on hand, cost price, selling price, low stock threshold
- SKU uniqueness enforced per organization
- Product list with search by name or SKU
- Inline stock adjustment (`+/- N` units) from the product list
- Delete confirmation before hard delete

### Dashboard
- Total product count
- Sum of quantity on hand across all products
- Low stock table (quantity ≤ effective threshold)

### Settings
- Organization default low stock threshold (default: 5)
- Used when a product has no per-product threshold

---

## Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **npm** 10+ (comes with Node.js)
- **Docker Desktop** (recommended) for local PostgreSQL, or an existing PostgreSQL 14+ instance
- A terminal and modern desktop browser

---

## Installation

```bash
# Clone or navigate to the project directory
cd wexa

# Install dependencies (also runs `prisma generate` via postinstall)
npm install

# Copy environment template
cp .env.example .env   # On Windows: copy .env.example .env

# Start PostgreSQL (Docker — maps host port 5433)
npm run db:up

# Apply database migrations
npm run db:migrate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Docker Compose exposes PostgreSQL on port **5433** (not 5432) to avoid conflicts with an existing local Postgres install. Update `DATABASE_URL` in `.env` if you use a different host or port.

---

## Environment setup

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://stockflow:stockflow@localhost:5433/stockflow` |
| `PGSSLMODE` | SSL validation mode for PostgreSQL | `disable` or `no-verify` when using self-signed certs |
| `JWT_SECRET` | Secret for signing session tokens (use a long random string in production) | `your-secret-here` |
| `NODE_ENV` | Environment | `development` |

**Important:** Change `JWT_SECRET` before deploying to production.

> If your database uses a self-signed TLS certificate, set `PGSSLMODE=no-verify` in `.env`.

---

## Running the application

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (default port 3000) |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:push` | Push schema changes without migration files |
| `npm run db:studio` | Open Prisma Studio to inspect data |

---

## Project structure

```
wexa/
├── docker-compose.yml         # Local PostgreSQL for development
├── prisma/
│   ├── schema.prisma          # Database models (Organization, User, Product)
│   └── migrations/            # SQL migration history
├── src/
│   ├── app/
│   │   ├── api/               # REST API route handlers
│   │   │   ├── auth/          # signup, login, logout
│   │   │   ├── products/      # product CRUD + stock adjust
│   │   │   ├── dashboard/     # summary + low stock
│   │   │   └── settings/      # org defaults
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── products/          # Product list, create, edit
│   │   └── settings/          # Settings page
│   ├── components/
│   │   ├── auth/              # Login/signup forms
│   │   ├── dashboard/         # Dashboard UI
│   │   ├── layout/            # App shell with navigation
│   │   ├── products/          # Product list, form, stock adjust
│   │   ├── settings/          # Settings form
│   │   └── ui/                # Reusable UI primitives
│   ├── lib/
│   │   ├── auth.ts            # JWT session helpers
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── inventory.ts       # Low-stock logic
│   │   ├── validation.ts      # Zod schemas
│   │   └── api.ts             # API auth helpers
│   ├── generated/prisma/      # Generated Prisma client (gitignored)
│   └── middleware.ts          # Route protection
├── scripts/
│   └── check-db.js            # Optional DB inspection helper
├── .env.example
├── README.md
└── VIDEO_SCRIPT.md
```

---

## Design decisions and assumptions

### Tech stack
- **Next.js 16 (App Router)** — full-stack React framework with API routes and server components
- **Prisma 7 + PostgreSQL** — production-grade relational database with migrations
- **Tailwind CSS 4** — utility-first styling without a heavy UI kit
- **Zod** — shared request validation on API routes
- **bcryptjs** — password hashing
- **jose** — JWT creation and verification in HTTP-only cookies

### Multi-tenancy
- Each signup creates one `Organization` and one `User` linked to it
- All queries filter by `organizationId` from the session JWT
- Cross-tenant access is prevented at the API layer (products are fetched with org scope)

### Low stock logic
- A product is low stock when `quantityOnHand <= effectiveThreshold`
- Effective threshold = product `lowStockThreshold` if set, otherwise organization `defaultLowStockThreshold` (default 5)

### Authentication
- Session-based auth via JWT in an `httpOnly` cookie (`stockflow-token`)
- Middleware protects `/dashboard`, `/products`, `/settings`, and all `/api/*` routes except login/signup
- Password reset is out of scope (manual DB reset if needed)

### Trade-offs for the 6-hour MVP
- **Dockerized PostgreSQL** on port 5433 for local dev — swap `DATABASE_URL` for managed Postgres in production
- **Hard delete** for products — acceptable per PRD
- **No stock movement history** — only `lastUpdatedBy` and `updatedAt` on products
- **Client-side data fetching** on list/dashboard pages — keeps pages simple; server components used where helpful (edit page preload)
- **Single user per org** — no invites or RBAC

---

## API endpoints

All protected endpoints require a valid session cookie.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create user + organization |
| `POST` | `/api/auth/login` | Authenticate and set session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |

**Signup body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "organizationName": "My Test Store"
}
```

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products?search=` | List products (optional search) |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/:id` | Get single product |
| `PUT` | `/api/products/:id` | Update product |
| `PATCH` | `/api/products/:id` | Adjust stock (`{ "adjustment": -2 }`) |
| `DELETE` | `/api/products/:id` | Delete product |

### Dashboard & settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Summary stats + low stock items |
| `GET` | `/api/settings` | Get organization settings |
| `PUT` | `/api/settings` | Update default low stock threshold |

---

## API Reference

For the full API reference, see [API_GUIDE.md](./API_GUIDE.md).


## Testing instructions

### Manual end-to-end test

1. **Sign up** at `/signup` with email, password, and organization name.
2. Confirm you land on **Dashboard** with zero products.
3. Go to **Products → Add product** and create an item (e.g. SKU `WGT-001`, quantity `3`, threshold `5`).
4. Verify the product appears in the list with a **Low** stock badge.
5. Return to **Dashboard** — confirm totals and low-stock section update.
6. Use **Adjust** on the product list to add `+10` units; confirm quantity updates.
7. Go to **Settings** and change the default threshold; verify low-stock behavior for products without their own threshold.
8. **Log out**, sign up as a second user with a different org, and confirm you cannot see the first org's products.

### Build verification

```bash
npm run build
```

This runs `prisma generate` and a production Next.js build to catch type and compile errors.

### Database inspection

```bash
npm run db:studio
```

Or run `node scripts/check-db.js` to list tables in local SQLite files.

---

## Future improvements

- PostgreSQL deployment with connection pooling (managed hosting)
- Password reset via email
- Stock movement audit log
- Multi-user organizations with invites and roles
- CSV import/export
- Email alerts for low stock
- Purchase orders and supplier management
- Channel integrations (Shopify, Amazon, etc.)
- Billing and subscription management
- Mobile-responsive polish and dark mode
- Automated test suite (unit + E2E with Playwright)

---

## Troubleshooting

### `Table does not exist` or connection errors

Ensure PostgreSQL is running:

```bash
npm run db:up
npm run db:migrate
```

Verify connectivity:

```bash
node scripts/check-db.js
```

Ensure `DATABASE_URL` matches your Postgres host and port (default: `localhost:5433`).

### Port already in use

Next.js will try the next available port, or specify one:

```bash
npm run dev -- -p 3001
```

### Prisma client not found

```bash
npm run db:generate
```

### Session / 401 errors after code changes

Restart the dev server after changing `src/lib/db.ts` or environment variables.

### `JWT_SECRET` errors

Ensure `.env` contains `JWT_SECRET` and restart the server.

---

## License

Internal / demo use for the StockFlow MVP phase.
