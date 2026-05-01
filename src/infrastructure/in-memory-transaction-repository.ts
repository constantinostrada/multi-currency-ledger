/**
 * InMemoryTransactionRepository — In-process implementation of
 * ITransactionRepository.
 *
 * Stores Transaction instances directly (the entity is already frozen and
 * immutable, so a snapshot copy is not needed) in a primary Map keyed by
 * transaction id, with a secondary index from idempotency key to id for
 * O(1) lookups. Append-only: there are no methods that update, replace, or
 * remove a stored transaction.
 */

import { Transaction } from "@/domain/transaction";
import {
  ITransactionRepository,
  FindTransactionsByAccountIdOptions,
} from "@/domain/transaction-repository";
import { IdempotencyKey } from "@/domain/types";
import { DuplicateIdempotencyKeyError } from "@/domain/errors";

export class InMemoryTransactionRepository implements ITransactionRepository {
  private readonly byId = new Map<string, Transaction>();
  private readonly idByIdempotencyKey = new Map<IdempotencyKey, string>();

  async append(transaction: Transaction): Promise<void> {
    if (this.byId.has(transaction.id)) {
      throw new Error(`Transaction with id "${transaction.id}" already exists.`);
    }
    if (this.idByIdempotencyKey.has(transaction.idempotencyKey)) {
      throw new DuplicateIdempotencyKeyError(transaction.idempotencyKey);
    }
    this.byId.set(transaction.id, transaction);
    this.idByIdempotencyKey.set(transaction.idempotencyKey, transaction.id);
  }

  async findByAccountId(
    accountId: string,
    options: FindTransactionsByAccountIdOptions = {},
  ): Promise<Transaction[]> {
    const fromMs = options.from?.getTime();
    const toMs = options.to?.getTime();
    const out: Transaction[] = [];
    for (const tx of this.byId.values()) {
      if (tx.accountId !== accountId) continue;
      const t = tx.createdAt.getTime();
      if (fromMs !== undefined && t < fromMs) continue;
      if (toMs !== undefined && t > toMs) continue;
      out.push(tx);
    }
    return out;
  }

  async findByIdempotencyKey(idempotencyKey: IdempotencyKey): Promise<Transaction | null> {
    const id = this.idByIdempotencyKey.get(idempotencyKey);
    if (id === undefined) return null;
    return this.byId.get(id) ?? null;
  }
}
