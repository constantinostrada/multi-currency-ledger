/**
 * ListLedgerEntriesUseCase — Application Layer
 *
 * Returns a paginated list of ledger entries for a given account.
 */

import { AccountNotFoundException } from "@/domain/exceptions/DomainException";
import { IAccountRepository } from "@/domain/repositories/IAccountRepository";
import { ILedgerEntryRepository } from "@/domain/repositories/ILedgerEntryRepository";
import type { ListLedgerEntriesDTO, PaginatedLedgerEntriesDTO } from "../dtos/LedgerEntryDTO";
import { LedgerEntryMapper } from "../mappers/LedgerEntryMapper";

export class ListLedgerEntriesUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
  ) {}

  async execute(dto: ListLedgerEntriesDTO): Promise<PaginatedLedgerEntriesDTO> {
    // Confirm the account exists before listing its entries
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) throw new AccountNotFoundException(dto.accountId);

    const limit = dto.limit ?? 50;
    const offset = dto.offset ?? 0;

    const filter = {
      accountId: dto.accountId,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
      toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      limit,
      offset,
    };

    const [entries, total] = await Promise.all([
      this.ledgerEntryRepository.findByFilter(filter),
      this.ledgerEntryRepository.countByFilter(filter),
    ]);

    return {
      entries: entries.map(LedgerEntryMapper.toDTO),
      total,
      limit,
      offset,
    };
  }
}
