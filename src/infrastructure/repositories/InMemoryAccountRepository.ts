/**
 * InMemoryAccountRepository — Infrastructure Layer
 *
 * A simple in-memory implementation of IAccountRepository.
 * Ideal for development, testing, and demos — swap for a real DB adapter in production.
 *
 * Stores serialised snapshots of Account entities and re-hydrates on read to prevent
 * callers from holding stale mutable references.
 */

import { Account } from "@/domain/entities/Account";
import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import { IAccountRepository } from "@/domain/repositories/IAccountRepository";

interface AccountSnapshot {
  id: string;
  ownerId: string;
  name: string;
  currencyCode: string;
  balanceMinorUnits: bigint;
  allowOverdraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSnapshot(account: Account): AccountSnapshot {
  return {
    id: account.id,
    ownerId: account.ownerId,
    name: account.name,
    currencyCode: account.currency.code,
    balanceMinorUnits: account.balance.minorUnits,
    allowOverdraft: account.allowOverdraft,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function fromSnapshot(snap: AccountSnapshot): Account {
  const currency = Currency.of(snap.currencyCode);
  return new Account({
    id: snap.id,
    ownerId: snap.ownerId,
    name: snap.name,
    currency,
    balanceMinorUnits: snap.balanceMinorUnits,
    allowOverdraft: snap.allowOverdraft,
    createdAt: new Date(snap.createdAt),
    updatedAt: new Date(snap.updatedAt),
  });
}

export class InMemoryAccountRepository implements IAccountRepository {
  private readonly store = new Map<string, AccountSnapshot>();

  async findById(id: string): Promise<Account | null> {
    const snap = this.store.get(id);
    return snap ? fromSnapshot(snap) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Account[]> {
    return Array.from(this.store.values())
      .filter((s) => s.ownerId === ownerId)
      .map(fromSnapshot);
  }

  async save(account: Account): Promise<void> {
    if (this.store.has(account.id)) {
      throw new Error(`Account with id "${account.id}" already exists.`);
    }
    this.store.set(account.id, toSnapshot(account));
  }

  async update(account: Account): Promise<void> {
    if (!this.store.has(account.id)) {
      throw new Error(`Account with id "${account.id}" not found — cannot update.`);
    }
    this.store.set(account.id, toSnapshot(account));
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /** Test/dev helper — clears all data. */
  clear(): void {
    this.store.clear();
  }

  /** Test/dev helper — current count. */
  get size(): number {
    return this.store.size;
  }
}
