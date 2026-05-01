/**
 * Domain error catalog.
 *
 * Typed error classes that signal business-rule violations. Application
 * and interface layers can map them to HTTP status codes or use-case
 * results. Pure TypeScript; no third-party imports.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientFundsError extends DomainError {
  readonly accountId: string;

  constructor(accountId: string, message?: string) {
    super(message ?? `Insufficient funds in account "${accountId}".`);
    this.name = "InsufficientFundsError";
    this.accountId = accountId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NoExchangeRateError extends DomainError {
  readonly fromCurrency: string;
  readonly toCurrency: string;

  constructor(fromCurrency: string, toCurrency: string, message?: string) {
    super(message ?? `No exchange rate available from ${fromCurrency} to ${toCurrency}.`);
    this.name = "NoExchangeRateError";
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateIdempotencyKeyError extends DomainError {
  readonly idempotencyKey: string;

  constructor(idempotencyKey: string, message?: string) {
    super(message ?? `Duplicate idempotency key: "${idempotencyKey}".`);
    this.name = "DuplicateIdempotencyKeyError";
    this.idempotencyKey = idempotencyKey;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountNotFoundError extends DomainError {
  readonly accountId: string;

  constructor(accountId: string, message?: string) {
    super(message ?? `Account not found: "${accountId}".`);
    this.name = "AccountNotFoundError";
    this.accountId = accountId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
