/**
 * LedgerEntryMapper — Application Layer
 */

import { LedgerEntry } from "@/domain/entities/LedgerEntry";
import type { LedgerEntryDTO } from "../dtos/LedgerEntryDTO";

export class LedgerEntryMapper {
  static toDTO(entry: LedgerEntry): LedgerEntryDTO {
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
