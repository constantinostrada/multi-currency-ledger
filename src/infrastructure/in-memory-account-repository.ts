/**
 * InMemoryAccountRepository — In-process implementation of IAccountRepository.
 *
 * Backed by a Map keyed by account id. Stores plain snapshots and rebuilds
 * fresh `Account` instances on every read so callers cannot reach back
 * into the store and mutate persisted state. The only path to changing a
 * stored balance is `updateBalance`.
 */

import { Account } from "@/domain/account";
import { IAccountRepository } from "@/domain/account-repository";
import { Currency, Money, OwnerId } from "@/domain/types";
import { AccountNotFoundError } from "@/domain/errors";

interface AccountSnapshot {
  id: string;
  ownerId: OwnerId;
  currency: Currency;
  balanceMinorUnits: bigint;
  createdAt: number;
}

function snapshotOf(account: Account): AccountSnapshot {
  return {
    id: account.id,
    ownerId: account.ownerId,
    currency: account.currency,
    balanceMinorUnits: account.balance.minorUnits,
    createdAt: account.createdAt.getTime(),
  };
}

function rebuild(snap: AccountSnapshot): Account {
  return new Account({
    id: snap.id,
    ownerId: snap.ownerId,
    currency: snap.currency,
    balance: Money.fromMinorUnits(snap.balanceMinorUnits, snap.currency),
    createdAt: new Date(snap.createdAt),
  });
}

export class InMemoryAccountRepository implements IAccountRepository {
  private readonly store = new Map<string, AccountSnapshot>();

  async create(account: Account): Promise<void> {
    if (this.store.has(account.id)) {
      throw new Error(`Account with id "${account.id}" already exists.`);
    }
    this.store.set(account.id, snapshotOf(account));
  }

  async findById(id: string): Promise<Account | null> {
    const snap = this.store.get(id);
    return snap ? rebuild(snap) : null;
  }

  async findByOwnerId(ownerId: OwnerId): Promise<Account[]> {
    const out: Account[] = [];
    for (const snap of this.store.values()) {
      if (snap.ownerId === ownerId) {
        out.push(rebuild(snap));
      }
    }
    return out;
  }

  async updateBalance(id: string, newBalance: Money): Promise<void> {
    const snap = this.store.get(id);
    if (!snap) {
      throw new AccountNotFoundError(id);
    }
    if (!newBalance.currency.equals(snap.currency)) {
      throw new Error(
        `Currency mismatch updating account "${id}": stored ` +
          `${snap.currency.code}, got ${newBalance.currency.code}.`,
      );
    }
    this.store.set(id, { ...snap, balanceMinorUnits: newBalance.minorUnits });
  }
}
