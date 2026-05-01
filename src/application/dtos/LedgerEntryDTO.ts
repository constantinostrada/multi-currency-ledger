/**
 * LedgerEntry DTOs — Application Layer
 */

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface ListLedgerEntriesDTO {
  accountId: string;
  fromDate?: string; // ISO 8601
  toDate?: string; // ISO 8601
  limit?: number;
  offset?: number;
}

// ─── Output DTOs ─────────────────────────────────────────────────────────────

export interface LedgerEntryDTO {
  id: string;
  accountId: string;
  type: string;
  currencyCode: string;
  amount: string;
  description: string;
  referenceId: string | undefined;
  createdAt: string;
}

export interface PaginatedLedgerEntriesDTO {
  entries: LedgerEntryDTO[];
  total: number;
  limit: number;
  offset: number;
}
