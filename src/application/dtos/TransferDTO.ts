/**
 * Transfer DTOs — Application Layer
 */

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface InitiateTransferDTO {
  sourceAccountId: string;
  destinationAccountId: string;
  /** Decimal amount to debit from the source account, e.g. "250.00" */
  amount: string;
  description: string;
}

export interface GetTransferDTO {
  transferId: string;
}

export interface ListTransfersByAccountDTO {
  accountId: string;
}

// ─── Output DTOs ─────────────────────────────────────────────────────────────

export interface TransferResponseDTO {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceCurrencyCode: string;
  destinationCurrencyCode: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: number;
  status: string;
  isCrossCurrency: boolean;
  description: string;
  createdAt: string;
  completedAt: string | null;
}

export interface LedgerEntryResponseDTO {
  id: string;
  accountId: string;
  type: string;
  currencyCode: string;
  amount: string;
  description: string;
  referenceId: string | undefined;
  createdAt: string;
}

export interface InitiateTransferResultDTO {
  transfer: TransferResponseDTO;
  debitEntry: LedgerEntryResponseDTO;
  creditEntry: LedgerEntryResponseDTO;
}
