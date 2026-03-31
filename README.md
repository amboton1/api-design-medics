# API Design Medics

A REST API for managing medications, prescriptions, inventory, and pharmacy orders. Built as a learning project to explore Node.js backend development.

## What it does

This API simulates a pharmaceutical management system where:

- **Patients** can track their active medications
- **Doctors** can write prescriptions
- **Pharmacists** can manage inventory and fulfill orders
- **Admins** can manage all resources

The main focus is a clean, well-structured Express API with a real PostgreSQL database.

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

### Medications

```
GET    /medications          List all (supports pagination & filtering)
GET    /medications/:id      Get one by ID
POST   /medications          Create a new medication
PATCH  /medications/:id      Update a medication
DELETE /medications/:id      Delete a medication
```

### Auth (in progress)

```
POST   /register
POST   /login
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
