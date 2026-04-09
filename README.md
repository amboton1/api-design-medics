# API Design Medics

A production-deployed REST API simulating a pharmaceutical management system — built to practice real-world backend API design, role-based authentication, and relational data modeling.

**Live URL:** https://api-design-medics.onrender.com

## About the project

The Medics API covers the full lifecycle of a pharmacy ecosystem: from user registration with role-based access, through prescription management between doctors and pharmacists, to inventory tracking with batch-level detail and supplier order management.

The focus was on building a clean, well-structured Express API with proper authentication, input validation, centralized error handling, and automated testing — not just a basic CRUD app.

Key things implemented:

- **Role-based access control (RBAC)** — four roles (patient, doctor, pharmacist, admin) each with different permissions enforced at the route level
- **Prescriptions workflow** — doctors create prescriptions, pharmacists update fulfillment status, patients view their own
- **Inventory with batch tracking** — stock management including lot numbers, expiration dates, and a full transaction audit trail
- **Supplier orders** — order lifecycle management with line items and pharmacy records
- **Pagination and filtering** — query params for limit/offset and field-level filtering across list endpoints
- **JWT authentication** — stateless auth with bcrypt password hashing
- **Zod validation** — all request bodies and query params validated with reusable middleware
- **Integration tests** — endpoint tests with Vitest and Supertest against a real database

## Tech stack

| Layer | Tool |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js 5 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | JWT (jose) + bcrypt |
| Validation | Zod |
| Testing | Vitest + Supertest |

## Project structure

```
src/
├── index.ts                   # Starts the server
├── server.ts                  # Express app setup (middleware, routes)
├── router.ts                  # Mounts all route modules at /api/v1
├── auth/                      # Login & register routes
├── db/
│   ├── schema/                # Database table definitions (Drizzle)
│   ├── migrations/            # Auto-generated SQL migrations
│   └── seed.ts                # Sample data for development
├── modules/
│   └── medications/
│       ├── medications.routes.ts     # HTTP handlers
│       ├── medications.service.ts    # Business logic
│       └── medications.validators.ts # Zod input schemas
├── middleware/
│   ├── validate.ts            # Request validation middleware
│   └── errorHandler.ts        # Global error handler
└── lib/
    └── AppError.ts            # Custom error class
```

The `modules/` pattern separates each feature into its own folder with routes, service, and validators — this keeps things organized as the app grows.

## Getting started

**Prerequisites:** Docker (for PostgreSQL), Node.js 18+

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the database
npm run db:start

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start the dev server
npm run dev
```

The server runs on `http://localhost:3000` by default.

## API endpoints

All routes are prefixed with `/api/v1`.

### Auth
```
POST   /auth/register
POST   /auth/login
```

### Users (admin only)
```
GET    /auth/users
GET    /auth/users/:id
PUT    /auth/users/:id
DELETE /auth/users/:id
```

### Medications
```
GET    /medications          List all (pagination & filtering)
GET    /medications/:id
POST   /medications          (admin)
PATCH  /medications/:id      (admin)
DELETE /medications/:id      (admin)
```

### Prescriptions
```
GET    /prescriptions
GET    /prescriptions/:id
POST   /prescriptions        (doctor, admin)
PATCH  /prescriptions/:id
PATCH  /prescriptions/:id/status   (pharmacist, admin)
DELETE /prescriptions/:id    (admin)
```

### Inventory
```
GET    /inventory
GET    /inventory/:medication_id
POST   /inventory
PATCH  /inventory/:medication_id
GET    /inventory/:medication_id/batches
POST   /inventory/:medication_id/batches
GET    /inventory/:medication_id/transactions
POST   /inventory/:medication_id/transactions
```

### Orders & Pharmacies
```
GET    /orders/pharmacies
POST   /orders/pharmacies    (admin)
PATCH  /orders/pharmacies/:id
DELETE /orders/pharmacies/:id

GET    /orders
GET    /orders/:id
POST   /orders               (admin)
PATCH  /orders/:id           (admin)
DELETE /orders/:id           (admin)
GET    /orders/:id/items
POST   /orders/:id/items
PATCH  /orders/:id/items/:itemId
DELETE /orders/:id/items/:itemId
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `DB_URL` | PostgreSQL connection string | required |
| `JWT_SECRET` | Secret for signing tokens | required |
| `NODE_ENV` | `development` or `production` | `development` |

## Database commands

```bash
npm run db:start      # Start PostgreSQL via Docker
npm run db:stop       # Stop PostgreSQL
npm run db:generate   # Generate a new migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:seed       # Seed the database with sample data
```

## Running tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## What I learned building this

- Structuring an Express app into feature modules (routes / service / validators)
- Using Drizzle ORM for type-safe database queries and schema-driven migrations
- Validating request bodies with Zod and a reusable middleware
- Centralised error handling with a custom `AppError` class
- Protecting routes with JWT middleware and role-based access control
- Setting up PostgreSQL locally with Docker Compose


<a href="https://www.buymeacoffee.com/botarius" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
