/**
 * ITransactionRepository — Repository contract for the append-only Transaction
 * ledger.
 *
 * Structurally append-only: only `append` writes, and the read methods cannot
 * mutate the persisted record. There are intentionally NO `update`, `delete`,
 * `replace`, or `remove` methods, and there will never be — the ledger is the
 * authoritative audit trail.
 */

import { Transaction } from "./transaction";
import { IdempotencyKey } from "./types";

export interface FindTransactionsByAccountIdOptions {
  /** Inclusive lower bound on `Transaction.createdAt`. */
  from?: Date;
  /** Inclusive upper bound on `Transaction.createdAt`. */
  to?: Date;
}

export interface ITransactionRepository {
  /**
   * Persist a brand-new transaction. Throws `DuplicateIdempotencyKeyError`
   * (from `./errors`) if a transaction with the same idempotency key has
   * already been appended.
   */
  append(transaction: Transaction): Promise<void>;

  /**
   * Return every transaction stored for the given account, optionally filtered
   * by an inclusive `[from, to]` window on `createdAt`. Both bounds are
   * optional; missing bounds mean unbounded on that side.
   */
  findByAccountId(
    accountId: string,
    options?: FindTransactionsByAccountIdOptions,
  ): Promise<Transaction[]>;

  /**
   * Return the single transaction associated with the given idempotency key,
   * or `null` if no transaction has been appended under that key. Used by
   * application code to short-circuit retries before calling `append`.
   */
  findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Transaction | null>;
}
