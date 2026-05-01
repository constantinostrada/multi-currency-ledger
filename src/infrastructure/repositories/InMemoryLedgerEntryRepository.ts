/**
 * InMemoryLedgerEntryRepository — Infrastructure Layer
 *
 * Append-only in-memory implementation of ILedgerEntryRepository.
 */

import { LedgerEntry } from "@/domain/entities/LedgerEntry";
import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import { TransactionType } from "@/domain/value-objects/TransactionType";
import {
  ILedgerEntryRepository,
  LedgerEntryFilter,
} from "@/domain/repositories/ILedgerEntryRepository";

interface LedgerEntrySnapshot {
  id: string;
  accountId: string;
  typeValue: string;
  amountMinorUnits: bigint;
  currencyCode: string;
  description: string;
  referenceId: string | undefined;
  createdAt: Date;
}

function toSnapshot(entry: LedgerEntry): LedgerEntrySnapshot {
  return {
    id: entry.id,
    accountId: entry.accountId,
    typeValue: entry.type.value,
    amountMinorUnits: entry.amount.minorUnits,
    currencyCode: entry.amount.currency.code,
    description: entry.description,
    referenceId: entry.referenceId,
    createdAt: entry.createdAt,
  };
}

function fromSnapshot(snap: LedgerEntrySnapshot): LedgerEntry {
  const currency = Currency.of(snap.currencyCode);
  const amount = Money.fromMinorUnits(snap.amountMinorUnits, currency);
  return new LedgerEntry({
    id: snap.id,
    accountId: snap.accountId,
    type: TransactionType.of(snap.typeValue),
    amount,
    description: snap.description,
    referenceId: snap.referenceId,
    createdAt: new Date(snap.createdAt),
  });
}

export class InMemoryLedgerEntryRepository implements ILedgerEntryRepository {
  /** Ordered list — maintained in insertion order (append-only). */
  private readonly entries: LedgerEntrySnapshot[] = [];

  async save(entry: LedgerEntry): Promise<void> {
    this.entries.push(toSnapshot(entry));
  }

  async findById(id: string): Promise<LedgerEntry | null> {
    const snap = this.entries.find((e) => e.id === id);
    return snap ? fromSnapshot(snap) : null;
  }

  async findByFilter(filter: LedgerEntryFilter): Promise<LedgerEntry[]> {
    let results = this.entries.filter((e) => e.accountId === filter.accountId);

    if (filter.fromDate) {
      const from = filter.fromDate.getTime();
      results = results.filter((e) => e.createdAt.getTime() >= from);
    }
    if (filter.toDate) {
      const to = filter.toDate.getTime();
      results = results.filter((e) => e.createdAt.getTime() <= to);
    }

    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? results.length;
    return results.slice(offset, offset + limit).map(fromSnapshot);
  }

  async countByFilter(
    filter: Omit<LedgerEntryFilter, "limit" | "offset">,
  ): Promise<number> {
    let results = this.entries.filter((e) => e.accountId === filter.accountId);

    if (filter.fromDate) {
      const from = filter.fromDate.getTime();
      results = results.filter((e) => e.createdAt.getTime() >= from);
    }
    if (filter.toDate) {
      const to = filter.toDate.getTime();
      results = results.filter((e) => e.createdAt.getTime() <= to);
    }

    return results.length;
  }

  /** Test/dev helper. */
  clear(): void {
    this.entries.length = 0;
  }
}
