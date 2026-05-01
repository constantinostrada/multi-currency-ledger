/**
 * ILedgerEntryRepository — Repository Interface (Domain)
 *
 * Append-only storage contract for LedgerEntry.
 * Entries are never deleted or modified once written.
 */

import { LedgerEntry } from "../entities/LedgerEntry";

export interface LedgerEntryFilter {
  accountId: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ILedgerEntryRepository {
  /** Append a new ledger entry. */
  save(entry: LedgerEntry): Promise<void>;

  /** Retrieve a single entry by ID. */
  findById(id: string): Promise<LedgerEntry | null>;

  /** List entries for an account, optionally filtered by date range. */
  findByFilter(filter: LedgerEntryFilter): Promise<LedgerEntry[]>;

  /** Count entries matching a filter (useful for pagination). */
  countByFilter(filter: Omit<LedgerEntryFilter, "limit" | "offset">): Promise<number>;
}
