/**
 * TransferDomainService — Domain Service
 *
 * Orchestrates the business logic of executing a transfer between two accounts.
 * This logic doesn't belong to Account alone because it involves two accounts
 * and an exchange rate lookup — classic domain service territory.
 *
 * Note: This service receives all its dependencies via constructor (no imports
 * from outside domain/). The exchange rate service is injected as an interface.
 */

import { Account } from "../entities/Account";
import { LedgerEntry } from "../entities/LedgerEntry";
import { Transfer } from "../entities/Transfer";
import { IExchangeRateService } from "./ExchangeRateService";
import { Money } from "../value-objects/Money";
import { TransactionType } from "../value-objects/TransactionType";

export interface TransferInstruction {
  transferId: string;
  debitEntryId: string;
  creditEntryId: string;
  sourceAccount: Account;
  destinationAccount: Account;
  sourceAmount: Money;
  description: string;
  now: Date;
}

export interface TransferResult {
  transfer: Transfer;
  debitEntry: LedgerEntry;
  creditEntry: LedgerEntry;
}

export class TransferDomainService {
  constructor(private readonly exchangeRateService: IExchangeRateService) {}

  async execute(instruction: TransferInstruction): Promise<TransferResult> {
    const { sourceAccount, destinationAccount, sourceAmount } = instruction;

    const isCrossCurrency = !sourceAccount.currency.equals(destinationAccount.currency);

    let destinationAmount: Money;
    let rateValue: number;

    if (isCrossCurrency) {
      const { converted, rate } = await this.exchangeRateService.convert(
        sourceAmount,
        destinationAccount.currency,
      );
      destinationAmount = converted;
      rateValue = rate.rate;
    } else {
      destinationAmount = sourceAmount;
      rateValue = 1;
    }

    // Apply domain rules — Account enforces its own invariants
    sourceAccount.debit(sourceAmount);
    destinationAccount.credit(destinationAmount);

    const transfer = new Transfer({
      id: instruction.transferId,
      sourceAccountId: sourceAccount.id,
      destinationAccountId: destinationAccount.id,
      sourceAmount,
      destinationAmount,
      exchangeRate: rateValue,
      status: "PENDING",
      description: instruction.description,
      createdAt: instruction.now,
    });

    const debitEntry = new LedgerEntry({
      id: instruction.debitEntryId,
      accountId: sourceAccount.id,
      type: TransactionType.DEBIT,
      amount: sourceAmount,
      description: instruction.description,
      referenceId: instruction.transferId,
      createdAt: instruction.now,
    });

    const creditEntry = new LedgerEntry({
      id: instruction.creditEntryId,
      accountId: destinationAccount.id,
      type: TransactionType.CREDIT,
      amount: destinationAmount,
      description: instruction.description,
      referenceId: instruction.transferId,
      createdAt: instruction.now,
    });

    transfer.complete();

    return { transfer, debitEntry, creditEntry };
  }
}
