/**
 * AccountMapper — Application Layer
 *
 * Translates between Account domain entities and AccountResponseDTOs.
 * Keeps the serialisation concern out of both domain and controllers.
 */

import { Account } from "@/domain/entities/Account";
import type { AccountResponseDTO } from "../dtos/AccountDTO";

export class AccountMapper {
  static toResponseDTO(account: Account): AccountResponseDTO {
    return {
      id: account.id,
      ownerId: account.ownerId,
      name: account.name,
      currencyCode: account.currency.code,
      balance: account.balance.toDecimalString(),
      allowOverdraft: account.allowOverdraft,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
