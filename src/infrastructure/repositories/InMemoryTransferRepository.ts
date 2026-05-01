/**
 * InMemoryTransferRepository — Infrastructure Layer
 */

import { Transfer } from "@/domain/entities/Transfer";
import type { TransferStatus } from "@/domain/entities/Transfer";
import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import { ITransferRepository } from "@/domain/repositories/ITransferRepository";

interface TransferSnapshot {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmountMinorUnits: bigint;
  sourceCurrencyCode: string;
  destinationAmountMinorUnits: bigint;
  destinationCurrencyCode: string;
  exchangeRate: number;
  status: TransferStatus;
  description: string;
  createdAt: Date;
  completedAt: Date | undefined;
}

function toSnapshot(transfer: Transfer): TransferSnapshot {
  return {
    id: transfer.id,
    sourceAccountId: transfer.sourceAccountId,
    destinationAccountId: transfer.destinationAccountId,
    sourceAmountMinorUnits: transfer.sourceAmount.minorUnits,
    sourceCurrencyCode: transfer.sourceAmount.currency.code,
    destinationAmountMinorUnits: transfer.destinationAmount.minorUnits,
    destinationCurrencyCode: transfer.destinationAmount.currency.code,
    exchangeRate: transfer.exchangeRate,
    status: transfer.status,
    description: transfer.description,
    createdAt: transfer.createdAt,
    completedAt: transfer.completedAt,
  };
}

function fromSnapshot(snap: TransferSnapshot): Transfer {
  const sourceCurrency = Currency.of(snap.sourceCurrencyCode);
  const destCurrency = Currency.of(snap.destinationCurrencyCode);
  return new Transfer({
    id: snap.id,
    sourceAccountId: snap.sourceAccountId,
    destinationAccountId: snap.destinationAccountId,
    sourceAmount: Money.fromMinorUnits(snap.sourceAmountMinorUnits, sourceCurrency),
    destinationAmount: Money.fromMinorUnits(snap.destinationAmountMinorUnits, destCurrency),
    exchangeRate: snap.exchangeRate,
    status: snap.status,
    description: snap.description,
    createdAt: new Date(snap.createdAt),
    completedAt: snap.completedAt ? new Date(snap.completedAt) : undefined,
  });
}

export class InMemoryTransferRepository implements ITransferRepository {
  private readonly store = new Map<string, TransferSnapshot>();

  async findById(id: string): Promise<Transfer | null> {
    const snap = this.store.get(id);
    return snap ? fromSnapshot(snap) : null;
  }

  async findByAccountId(accountId: string): Promise<Transfer[]> {
    return Array.from(this.store.values())
      .filter(
        (s) => s.sourceAccountId === accountId || s.destinationAccountId === accountId,
      )
      .map(fromSnapshot);
  }

  async save(transfer: Transfer): Promise<void> {
    if (this.store.has(transfer.id)) {
      throw new Error(`Transfer with id "${transfer.id}" already exists.`);
    }
    this.store.set(transfer.id, toSnapshot(transfer));
  }

  async update(transfer: Transfer): Promise<void> {
    if (!this.store.has(transfer.id)) {
      throw new Error(`Transfer with id "${transfer.id}" not found — cannot update.`);
    }
    this.store.set(transfer.id, toSnapshot(transfer));
  }

  /** Test/dev helper. */
  clear(): void {
    this.store.clear();
  }
}
