/**
 * Account DTOs — Application Layer
 *
 * Plain data shapes that cross the use-case boundary.
 * No domain entities are ever returned directly to callers.
 */

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateAccountDTO {
  ownerId: string;
  name: string;
  /** ISO 4217 currency code, e.g. "USD" */
  currencyCode: string;
  /** Initial deposit in decimal form, e.g. "100.00". Defaults to "0.00". */
  initialBalance?: string;
  allowOverdraft?: boolean;
}

export interface GetAccountDTO {
  accountId: string;
}

export interface ListAccountsDTO {
  ownerId: string;
}

export interface RenameAccountDTO {
  accountId: string;
  newName: string;
}

// ─── Output DTOs ─────────────────────────────────────────────────────────────

export interface AccountResponseDTO {
  id: string;
  ownerId: string;
  name: string;
  currencyCode: string;
  /** Human-readable balance, e.g. "1050.00" */
  balance: string;
  allowOverdraft: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
