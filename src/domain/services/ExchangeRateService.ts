/**
 * ExchangeRateService — Domain Service Interface
 *
 * Defines the contract for converting amounts between currencies.
 * The actual implementation (calling an external API) lives in infrastructure.
 *
 * Lives in domain because exchange rate logic (applying a rate to Money)
 * is a core business concern, but the *retrieval* of rates is abstracted.
 */

import { Currency } from "../value-objects/Currency";
import { Money } from "../value-objects/Money";

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  /** Timestamp when this rate was fetched. */
  fetchedAt: Date;
}

export interface IExchangeRateService {
  /**
   * Fetch the current exchange rate from one currency to another.
   * Throws if the pair is not supported.
   */
  getRate(from: Currency, to: Currency): Promise<ExchangeRate>;

  /**
   * Convert a Money amount to a target currency using the current rate.
   * Returns the converted Money and the rate applied.
   */
  convert(amount: Money, toCurrency: Currency): Promise<{ converted: Money; rate: ExchangeRate }>;
}
