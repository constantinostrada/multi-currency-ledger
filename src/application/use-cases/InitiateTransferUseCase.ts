/**
 * InitiateTransferUseCase — Application Layer
 *
 * Orchestrates a funds transfer between two accounts.
 * Supports same-currency and cross-currency transfers.
 *
 * Steps:
 *   1. Load source + destination accounts.
 *   2. Delegate to TransferDomainService (which handles FX + account mutations).
 *   3. Persist all three records (transfer, debit entry, credit entry) and updated accounts.
 *   4. Return a result DTO.
 */

import { AccountNotFoundException } from "@/domain/exceptions/DomainException";
import { IAccountRepository } from "@/domain/repositories/IAccountRepository";
import { ILedgerEntryRepository } from "@/domain/repositories/ILedgerEntryRepository";
import { ITransferRepository } from "@/domain/repositories/ITransferRepository";
import { IExchangeRateService } from "@/domain/services/ExchangeRateService";
import { TransferDomainService } from "@/domain/services/TransferDomainService";
import { Money } from "@/domain/value-objects/Money";
import type { InitiateTransferDTO, InitiateTransferResultDTO } from "../dtos/TransferDTO";
import type { IIdGenerator } from "../ports/IIdGenerator";
import { TransferMapper } from "../mappers/TransferMapper";

export class InitiateTransferUseCase {
  private readonly transferDomainService: TransferDomainService;

  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transferRepository: ITransferRepository,
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
    private readonly idGenerator: IIdGenerator,
    exchangeRateService: IExchangeRateService,
  ) {
    this.transferDomainService = new TransferDomainService(exchangeRateService);
  }

  async execute(dto: InitiateTransferDTO): Promise<InitiateTransferResultDTO> {
    const [sourceAccount, destinationAccount] = await Promise.all([
      this.accountRepository.findById(dto.sourceAccountId),
      this.accountRepository.findById(dto.destinationAccountId),
    ]);

    if (!sourceAccount) throw new AccountNotFoundException(dto.sourceAccountId);
    if (!destinationAccount) throw new AccountNotFoundException(dto.destinationAccountId);

    const sourceAmount = Money.of(dto.amount, sourceAccount.currency);

    const { transfer, debitEntry, creditEntry } = await this.transferDomainService.execute({
      transferId: this.idGenerator.generate(),
      debitEntryId: this.idGenerator.generate(),
      creditEntryId: this.idGenerator.generate(),
      sourceAccount,
      destinationAccount,
      sourceAmount,
      description: dto.description,
      now: new Date(),
    });

    // Persist — all writes; a real implementation would wrap in a transaction
    await Promise.all([
      this.accountRepository.update(sourceAccount),
      this.accountRepository.update(destinationAccount),
      this.transferRepository.save(transfer),
      this.ledgerEntryRepository.save(debitEntry),
      this.ledgerEntryRepository.save(creditEntry),
    ]);

    return {
      transfer: TransferMapper.toTransferResponseDTO(transfer),
      debitEntry: TransferMapper.toLedgerEntryResponseDTO(debitEntry),
      creditEntry: TransferMapper.toLedgerEntryResponseDTO(creditEntry),
    };
  }
}
