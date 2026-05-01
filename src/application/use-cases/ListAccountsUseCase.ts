/**
 * ListAccountsUseCase — Application Layer
 *
 * Returns all accounts belonging to an owner.
 */

import { IAccountRepository } from "@/domain/repositories/IAccountRepository";
import type { ListAccountsDTO, AccountResponseDTO } from "../dtos/AccountDTO";
import { AccountMapper } from "../mappers/AccountMapper";

export class ListAccountsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(dto: ListAccountsDTO): Promise<AccountResponseDTO[]> {
    const accounts = await this.accountRepository.findByOwnerId(dto.ownerId);
    return accounts.map(AccountMapper.toResponseDTO);
  }
}
