/**
 * container.ts — Infrastructure Layer
 *
 * Manual dependency injection container.
 * Wires together all concrete implementations and use cases,
 * then exports them for use by the interfaces layer.
 *
 * In a larger app, replace this with a proper DI framework (e.g. tsyringe, InversifyJS).
 *
 * Using a module-level singleton pattern so Next.js API routes share the same
 * in-memory stores across requests in development (one Node.js process).
 */

import { InMemoryAccountRepository } from "./repositories/InMemoryAccountRepository";
import { InMemoryLedgerEntryRepository } from "./repositories/InMemoryLedgerEntryRepository";
import { InMemoryTransferRepository } from "./repositories/InMemoryTransferRepository";
import { StaticExchangeRateService } from "./exchange-rate/StaticExchangeRateService";
import { UuidGenerator } from "./id/UuidGenerator";

import { CreateAccountUseCase } from "@/application/use-cases/CreateAccountUseCase";
import { GetAccountUseCase } from "@/application/use-cases/GetAccountUseCase";
import { ListAccountsUseCase } from "@/application/use-cases/ListAccountsUseCase";
import { InitiateTransferUseCase } from "@/application/use-cases/InitiateTransferUseCase";
import { GetTransferUseCase } from "@/application/use-cases/GetTransferUseCase";
import { ListLedgerEntriesUseCase } from "@/application/use-cases/ListLedgerEntriesUseCase";

// ─── Repositories ────────────────────────────────────────────────────────────

const accountRepository = new InMemoryAccountRepository();
const ledgerEntryRepository = new InMemoryLedgerEntryRepository();
const transferRepository = new InMemoryTransferRepository();

// ─── Services ────────────────────────────────────────────────────────────────

const exchangeRateService = new StaticExchangeRateService();
const idGenerator = new UuidGenerator();

// ─── Use Cases ───────────────────────────────────────────────────────────────

export const createAccountUseCase = new CreateAccountUseCase(accountRepository, idGenerator);

export const getAccountUseCase = new GetAccountUseCase(accountRepository);

export const listAccountsUseCase = new ListAccountsUseCase(accountRepository);

export const initiateTransferUseCase = new InitiateTransferUseCase(
  accountRepository,
  transferRepository,
  ledgerEntryRepository,
  idGenerator,
  exchangeRateService,
);

export const getTransferUseCase = new GetTransferUseCase(transferRepository);

export const listLedgerEntriesUseCase = new ListLedgerEntriesUseCase(
  accountRepository,
  ledgerEntryRepository,
);
