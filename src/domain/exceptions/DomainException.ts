/**
 * DomainException — Base class for all domain-level errors.
 *
 * Using a distinct class lets the application and interface layers
 * distinguish domain rule violations from unexpected technical errors.
 */

export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainException";
    // Maintains proper prototype chain in transpiled TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountNotFoundException extends DomainException {
  constructor(accountId: string) {
    super(`Account not found: "${accountId}"`);
    this.name = "AccountNotFoundException";
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(accountId: string) {
    super(`Insufficient funds in account: "${accountId}"`);
    this.name = "InsufficientFundsException";
  }
}

export class CurrencyMismatchException extends DomainException {
  constructor(expected: string, received: string) {
    super(`Currency mismatch: expected ${expected}, received ${received}`);
    this.name = "CurrencyMismatchException";
  }
}

export class TransferNotFoundException extends DomainException {
  constructor(transferId: string) {
    super(`Transfer not found: "${transferId}"`);
    this.name = "TransferNotFoundException";
  }
}
