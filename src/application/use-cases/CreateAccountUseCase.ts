/**
 * CreateAccountUseCase — Application Layer
 *
 * Creates a new ledger account for a given owner.
 * Validates input, constructs the domain entity, and persists it.
 */

import { Account } from "@/domain/entities/Account";
import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import { IAccountRepository } from "@/domain/repositories/IAccountRepository";
import type { CreateAccountDTO, AccountResponseDTO } from "../dtos/AccountDTO";
import { AccountMapper } from "../mappers/AccountMapper";
import type { IIdGenerator } from "../ports/IIdGenerator";

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(dto: CreateAccountDTO): Promise<AccountResponseDTO> {
    const currency = Currency.of(dto.currencyCode);
    const initialBalance = dto.initialBalance ?? "0.00";
    const initialMoney = Money.of(initialBalance, currency);

    if (initialMoney.isNegative()) {
      throw new Error("Initial balance must be non-negative.");
    }

    const now = new Date();
    const account = new Account({
      id: this.idGenerator.generate(),
      ownerId: dto.ownerId,
      name: dto.name,
      currency,
      balanceMinorUnits: initialMoney.minorUnits,
      allowOverdraft: dto.allowOverdraft ?? false,
      createdAt: now,
      updatedAt: now,
    });

    await this.accountRepository.save(account);

    return AccountMapper.toResponseDTO(account);
  }
}
