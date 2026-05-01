/**
 * IExchangeRateRepository — Repository contract for ExchangeRate observations.
 *
 * Append-only by design: the contract surface declares no update or delete
 * operations. Lives in the domain so it has no awareness of any storage
 * technology.
 */

import { ExchangeRate } from "./exchange-rate";
import { Currency } from "./types";

export interface IExchangeRateRepository {
  /**
   * Persist a new historical observation. Never overwrites or deletes an
   * existing record.
   */
  append(rate: ExchangeRate): Promise<void>;

  /**
   * Return the rate for the directional pair (from → to) whose `effectiveAt`
   * is ≤ `asOf`, picking the most recent. Returns `null` when no such rate
   * exists. The boundary is inclusive: `effectiveAt === asOf` is applicable.
   */
  findLatestApplicable(from: Currency, to: Currency, asOf: Date): Promise<ExchangeRate | null>;
}
