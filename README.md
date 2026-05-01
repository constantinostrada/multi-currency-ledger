# multi-currency-ledger

A production-ready multi-currency ledger API built with **Next.js**, **TypeScript**, and **Clean Architecture**.

Track account balances across multiple currencies (USD, EUR, GBP, JPY, BTC, and more), record append-only ledger entries, and execute cross-currency transfers with real-time exchange rates — all with zero business logic leaking into your framework.

---

## Features

- 🏦 **Multi-currency accounts** — ISO 4217 + crypto (BTC, ETH)
- 💸 **Cross-currency transfers** — automatic FX conversion via pluggable exchange rate service
- 📒 **Append-only ledger** — immutable audit log of every credit and debit
- 🔌 **Swappable infrastructure** — static rates for dev, live HTTP API in production
- 🧅 **Clean Architecture** — strict layer boundaries enforced by ESLint
- ✅ **Fully typed** — strict TypeScript with no `any` escape hatches

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 (strict mode) |
| Testing | Jest + ts-jest |
| Linting | ESLint + `import/no-restricted-paths` |
| Formatting | Prettier |
| ID generation | UUID v4 |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local — see .env.example for all variables
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the API explorer.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint all TypeScript files |
| `npm run format` | Format all files with Prettier |
| `npm run type-check` | Run TypeScript compiler check |

---

## API Reference

All routes are under `/api/`. The server returns JSON; errors follow a `{ error, code }` shape.

### Accounts

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/accounts` | Create a new account |
| `GET` | `/api/accounts?ownerId=:id` | List all accounts for an owner |
| `GET` | `/api/accounts/:accountId` | Get a single account |
| `GET` | `/api/accounts/:accountId/ledger` | List ledger entries (paginated) |

**Create account body:**
```json
{
  "ownerId": "user-123",
  "name": "My EUR Wallet",
  "currencyCode": "EUR",
  "initialBalance": "1000.00",
  "allowOverdraft": false
}
```

### Transfers

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/transfers` | Initiate a transfer (same or cross-currency) |
| `GET` | `/api/transfers/:transferId` | Get a transfer by ID |

**Initiate transfer body:**
```json
{
  "sourceAccountId": "acc-abc",
  "destinationAccountId": "acc-xyz",
  "amount": "250.00",
  "description": "Monthly rent"
}
```

### Ledger entries query params

| Param | Type | Description |
|---|---|---|
| `fromDate` | ISO 8601 string | Filter entries after this date |
| `toDate` | ISO 8601 string | Filter entries before this date |
| `limit` | integer | Page size (default 50) |
| `offset` | integer | Pagination offset (default 0) |

---

## Supported Currencies

`USD`, `EUR`, `GBP`, `JPY`, `CHF`, `AUD`, `CAD`, `CNY`, `HKD`, `SGD`, `BTC`, `ETH`

---

## Project Structure

```
multi-currency-ledger/
├── src/
│   ├── domain/               # Layer 1 — Core business rules
│   │   ├── entities/         # Account, LedgerEntry, Transfer
│   │   ├── value-objects/    # Money, Currency, TransactionType
│   │   ├── repositories/     # IAccountRepository, ILedgerEntryRepository, ITransferRepository
│   │   ├── services/         # IExchangeRateService (interface), TransferDomainService
│   │   └── exceptions/       # DomainException, AccountNotFoundException, …
│   │
│   ├── application/          # Layer 2 — Use cases & orchestration
│   │   ├── use-cases/        # CreateAccount, InitiateTransfer, ListLedgerEntries, …
│   │   ├── dtos/             # Input/Output data shapes (no domain entities exposed)
│   │   ├── mappers/          # Domain entity → DTO translation
│   │   └── ports/            # IIdGenerator
│   │
│   ├── infrastructure/       # Layer 3 — Concrete implementations & I/O
│   │   ├── repositories/     # InMemoryAccountRepository, InMemory{Ledger,Transfer}Repository
│   │   ├── exchange-rate/    # StaticExchangeRateService, HttpExchangeRateService
│   │   ├── id/               # UuidGenerator
│   │   └── container.ts      # Manual DI wiring
│   │
│   ├── interfaces/           # Layer 4 — HTTP adapter helpers
│   │   └── http/helpers/     # apiResponse (ok, created, handleError, …)
│   │
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # Route handlers (call use cases, never business logic)
│   │   │   ├── accounts/
│   │   │   └── transfers/
│   │   ├── layout.tsx
│   │   └── page.tsx          # Landing page / API explorer
│   │
│   └── __tests__/            # Co-located unit tests per layer
│
├── CLAUDE.md                 # Global architecture contract
├── architecture.json         # Machine-readable layer rules
├── next.config.ts
├── tsconfig.json
├── jest.config.ts
├── .eslintrc.json            # Layer boundary enforcement via import/no-restricted-paths
├── .prettierrc
└── .env.example
```

---

## Clean Architecture Layers

This project enforces the **Dependency Rule**: source code dependencies can only point inward.

```
┌─────────────────────────────────────────────────────────┐
│                      Interfaces                          │
│         (Route Handlers, Response Helpers)               │
│                          │                               │
│                          ▼                               │
│                      Application                         │
│             (Use Cases, DTOs, Mappers)                   │
│                          │                               │
│                          ▼                               │
│                        Domain                            │
│       (Entities, Value Objects, Repo Interfaces)         │
│                          ▲                               │
│                          │                               │
│                    Infrastructure                        │
│        (Repos, Exchange Rate, UUID, Container)           │
└─────────────────────────────────────────────────────────┘
```

### Domain (`src/domain/`)
The heart of the application. Contains all business rules. Has **zero** dependencies on any framework, database, or external library.

- **Entities** protect their own invariants in the constructor.
- **Value Objects** are immutable and compared by value (`Money`, `Currency`, `TransactionType`).
- **Repository interfaces** describe *what* persistence operations are needed, not *how*.
- **Domain Services** handle logic that spans multiple entities (e.g. `TransferDomainService`).

### Application (`src/application/`)
Orchestrates domain objects to fulfill use cases. Knows *what* to do, not *how*.

- Each use case is one class with a single `execute(dto)` method.
- Use cases receive interfaces (not implementations) via constructor.
- Mappers translate domain entities → DTOs so raw entities never leak out.

### Infrastructure (`src/infrastructure/`)
Implements the interfaces defined in domain/application. All I/O lives here.

- Repository implementations store and retrieve domain entities (currently in-memory).
- `StaticExchangeRateService` — fixed rates for dev/test.
- `HttpExchangeRateService` — live rates via external API for production.
- `container.ts` — manual DI wiring; swap implementations here without touching other layers.

### Interfaces (`src/interfaces/` + `src/app/api/`)
Entry points. Translates HTTP requests into use case calls and use case output into HTTP responses.

- Route handlers are thin: **parse → validate shape → call use case → serialize**.
- No business logic here. No direct repository calls. No domain entity manipulation.

---

## Swapping Infrastructure

To use a real database or live exchange rates, implement the domain interfaces and re-wire in `container.ts`:

```ts
// src/infrastructure/container.ts

// Before (dev):
const exchangeRateService = new StaticExchangeRateService();

// After (production):
const exchangeRateService = new HttpExchangeRateService(); // reads from process.env
```

No other file needs to change. That's the power of the Dependency Rule.

---

## Running Tests

```bash
npm test                  # all tests
npm run test:coverage     # with coverage report
npm run test:watch        # watch mode
```

Tests are organised to mirror the source structure under `src/__tests__/`.

---

## License

MIT
