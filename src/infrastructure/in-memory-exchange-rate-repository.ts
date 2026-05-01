/**
 * InMemoryExchangeRateRepository — In-process implementation of
 * IExchangeRateRepository.
 *
 * Backed by an append-only array of snapshots. Stores plain snapshots and
 * rebuilds fresh frozen `ExchangeRate` instances on every read, so callers
 * cannot mutate persisted state through references. Linear scan is fine for
 * the in-memory adapter — it is parallel to (not a replacement for) any
 * future ORM-backed implementation.
 */

import { ExchangeRate } from "@/domain/exchange-rate";
import { IExchangeRateRepository } from "@/domain/exchange-rate-repository";
import { Currency } from "@/domain/types";

interface ExchangeRateSnapshot {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  effectiveAt: number;
  createdAt: number;
}

function snapshotOf(rate: ExchangeRate): ExchangeRateSnapshot {
  return {
    id: rate.id,
    fromCurrency: rate.fromCurrency,
    toCurrency: rate.toCurrency,
    rate: rate.rate,
    effectiveAt: rate.effectiveAt.getTime(),
    createdAt: rate.createdAt.getTime(),
  };
}

function rebuild(snap: ExchangeRateSnapshot): ExchangeRate {
  return new ExchangeRate({
    id: snap.id,
    fromCurrency: snap.fromCurrency,
    toCurrency: snap.toCurrency,
    rate: snap.rate,
    effectiveAt: new Date(snap.effectiveAt),
    createdAt: new Date(snap.createdAt),
  });
}

export class InMemoryExchangeRateRepository implements IExchangeRateRepository {
  private readonly log: ExchangeRateSnapshot[] = [];

  async append(rate: ExchangeRate): Promise<void> {
    this.log.push(snapshotOf(rate));
  }

  async findLatestApplicable(
    from: Currency,
    to: Currency,
    asOf: Date,
  ): Promise<ExchangeRate | null> {
    if (!(asOf instanceof Date) || Number.isNaN(asOf.getTime())) {
      throw new Error("findLatestApplicable: asOf must be a valid Date.");
    }
    const cutoff = asOf.getTime();

    let bestIndex = -1;
    let bestEffective = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < this.log.length; i++) {
      const snap = this.log[i]!;
      if (!snap.fromCurrency.equals(from)) continue;
      if (!snap.toCurrency.equals(to)) continue;
      if (snap.effectiveAt > cutoff) continue;
      // `>=` so insertion-order ties resolve to the latest appended.
      if (snap.effectiveAt >= bestEffective) {
        bestEffective = snap.effectiveAt;
        bestIndex = i;
      }
    }

    return bestIndex === -1 ? null : rebuild(this.log[bestIndex]!);
  }
}
