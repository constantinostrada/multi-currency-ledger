/**
 * GetAccountUseCase — Application Layer
 *
 * Retrieves a single account by ID.
 */

import { AccountNotFoundException } from "@/domain/exceptions/DomainException";
import { IAccountRepository } from "@/domain/repositories/IAccountRepository";
import type { GetAccountDTO, AccountResponseDTO } from "../dtos/AccountDTO";
import { AccountMapper } from "../mappers/AccountMapper";

export class GetAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(dto: GetAccountDTO): Promise<AccountResponseDTO> {
    const account = await this.accountRepository.findById(dto.accountId);

    if (!account) {
      throw new AccountNotFoundException(dto.accountId);
    }

    return AccountMapper.toResponseDTO(account);
  }
}
