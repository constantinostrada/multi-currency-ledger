/**
 * TransferMapper — Application Layer
 *
 * Maps Transfer and LedgerEntry domain entities to response DTOs.
 */

import { LedgerEntry } from "@/domain/entities/LedgerEntry";
import { Transfer } from "@/domain/entities/Transfer";
import type { LedgerEntryResponseDTO, TransferResponseDTO } from "../dtos/TransferDTO";

export class TransferMapper {
  static toTransferResponseDTO(transfer: Transfer): TransferResponseDTO {
    return {
      id: transfer.id,
      sourceAccountId: transfer.sourceAccountId,
      destinationAccountId: transfer.destinationAccountId,
      sourceCurrencyCode: transfer.sourceAmount.currency.code,
      destinationCurrencyCode: transfer.destinationAmount.currency.code,
      sourceAmount: transfer.sourceAmount.toDecimalString(),
      destinationAmount: transfer.destinationAmount.toDecimalString(),
      exchangeRate: transfer.exchangeRate,
      status: transfer.status,
      isCrossCurrency: transfer.isCrossCurrency,
      description: transfer.description,
      createdAt: transfer.createdAt.toISOString(),
      completedAt: transfer.completedAt ? transfer.completedAt.toISOString() : null,
    };
  }

  static toLedgerEntryResponseDTO(entry: LedgerEntry): LedgerEntryResponseDTO {
    return {
      id: entry.id,
      accountId: entry.accountId,
      type: entry.type.value,
      currencyCode: entry.amount.currency.code,
      amount: entry.amount.toDecimalString(),
      description: entry.description,
      referenceId: entry.referenceId,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
