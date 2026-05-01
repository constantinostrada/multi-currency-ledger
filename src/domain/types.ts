/**
 * Shared domain types.
 *
 * Canonical re-export point for the foundational types used across the
 * multi-currency ledger domain. Pure TypeScript; no third-party imports.
 */

export { Currency } from "./value-objects/Currency";
export type { CurrencyCode } from "./value-objects/Currency";
export { Money } from "./value-objects/Money";

const OWNER_ID_BRAND: unique symbol = Symbol("OwnerId");
const IDEMPOTENCY_KEY_BRAND: unique symbol = Symbol("IdempotencyKey");

export type OwnerId = string & { readonly [OWNER_ID_BRAND]: true };
export type IdempotencyKey = string & { readonly [IDEMPOTENCY_KEY_BRAND]: true };

export const OwnerId = (value: string): OwnerId => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("OwnerId must be a non-empty string.");
  }
  return value as OwnerId;
};

export const IdempotencyKey = (value: string): IdempotencyKey => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("IdempotencyKey must be a non-empty string.");
  }
  return value as IdempotencyKey;
};
