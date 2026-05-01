/**
 * Transaction — Domain Entity (clean rebuild for the multi-currency ledger).
 *
 * An immutable, append-only ledger entry: once constructed, no field can ever
 * change. The entity is `Object.freeze`d in the constructor and exposes no
 * mutators; the repository persists it as-is and never offers an update or
 * delete path. Pure TypeScript; no third-party imports.
 */

import { TransactionType } from "./value-objects/TransactionType";
import { Currency, IdempotencyKey, Money } from "./types";

export type TransactionMetadata = Readonly<Record<string, unknown>>;

export interface TransactionProps {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: Money;
  currency: Currency;
  idempotencyKey: IdempotencyKey;
  createdAt: Date;
  metadata?: TransactionMetadata;
}

export class Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly type: TransactionType;
  readonly amount: Money;
  readonly currency: Currency;
  readonly idempotencyKey: IdempotencyKey;
  readonly createdAt: Date;
  readonly metadata?: TransactionMetadata;

  constructor(props: TransactionProps) {
    if (typeof props.id !== "string" || props.id.trim() === "") {
      throw new Error("Transaction.id must be a non-empty string.");
    }
    if (typeof props.accountId !== "string" || props.accountId.trim() === "") {
      throw new Error("Transaction.accountId must be a non-empty string.");
    }
    if (!(props.type instanceof TransactionType)) {
      throw new Error("Transaction.type must be a TransactionType.");
    }
    if (!props.amount.isPositive()) {
      throw new Error("Transaction.amount must be a positive Money value.");
    }
    if (!props.amount.currency.equals(props.currency)) {
      throw new Error(
        `Transaction amount currency (${props.amount.currency.code}) ` +
          `does not match transaction currency (${props.currency.code}).`,
      );
    }
    if (!(props.createdAt instanceof Date) || Number.isNaN(props.createdAt.getTime())) {
      throw new Error("Transaction.createdAt must be a valid Date.");
    }

    this.id = props.id;
    this.accountId = props.accountId;
    this.type = props.type;
    this.amount = props.amount;
    this.currency = props.currency;
    this.idempotencyKey = props.idempotencyKey;
    this.createdAt = new Date(props.createdAt.getTime());
    if (props.metadata !== undefined) {
      this.metadata = Object.freeze({ ...props.metadata });
    }

    Object.freeze(this);
  }
}
