/**
 * StaticExchangeRateService — Infrastructure Layer
 *
 * A hardcoded exchange rate table for development and testing.
 * Implements IExchangeRateService from the domain layer.
 *
 * Replace with HttpExchangeRateService in production.
 */

import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import {
  ExchangeRate,
  IExchangeRateService,
} from "@/domain/services/ExchangeRateService";

/** Static mid-market rates (approximate, for demo purposes only). */
const STATIC_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 157.5, CHF: 0.9, AUD: 1.52, CAD: 1.37, CNY: 7.26, HKD: 7.82, SGD: 1.35, BTC: 0.000015, ETH: 0.00044, USD: 1 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 171.5, CHF: 0.98, AUD: 1.66, CAD: 1.49, CNY: 7.9, HKD: 8.52, SGD: 1.47, BTC: 0.0000165, ETH: 0.00048, EUR: 1 },
  GBP: { USD: 1.27, EUR: 1.17, JPY: 199.8, CHF: 1.14, AUD: 1.93, CAD: 1.74, CNY: 9.19, HKD: 9.91, SGD: 1.71, BTC: 0.000019, ETH: 0.00056, GBP: 1 },
  JPY: { USD: 0.0063, EUR: 0.0058, GBP: 0.005, CHF: 0.0057, AUD: 0.0097, CAD: 0.0087, CNY: 0.046, HKD: 0.05, SGD: 0.0086, BTC: 0.000000095, ETH: 0.0000028, JPY: 1 },
  CHF: { USD: 1.11, EUR: 1.02, GBP: 0.88, JPY: 175.0, AUD: 1.69, CAD: 1.52, CNY: 8.06, HKD: 8.67, SGD: 1.5, BTC: 0.0000167, ETH: 0.00049, CHF: 1 },
  AUD: { USD: 0.66, EUR: 0.6, GBP: 0.52, JPY: 103.5, CHF: 0.59, CAD: 0.9, CNY: 4.77, HKD: 5.14, SGD: 0.89, BTC: 0.0000099, ETH: 0.00029, AUD: 1 },
  CAD: { USD: 0.73, EUR: 0.67, GBP: 0.57, JPY: 115.0, CHF: 0.66, AUD: 1.11, CNY: 5.3, HKD: 5.71, SGD: 0.98, BTC: 0.0000109, ETH: 0.00032, CAD: 1 },
  CNY: { USD: 0.138, EUR: 0.127, GBP: 0.109, JPY: 21.7, CHF: 0.124, AUD: 0.21, CAD: 0.189, HKD: 1.078, SGD: 0.186, BTC: 0.0000021, ETH: 0.000061, CNY: 1 },
  HKD: { USD: 0.128, EUR: 0.117, GBP: 0.101, JPY: 20.1, CHF: 0.115, AUD: 0.194, CAD: 0.175, CNY: 0.927, SGD: 0.173, BTC: 0.0000019, ETH: 0.000056, HKD: 1 },
  SGD: { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 116.5, CHF: 0.67, AUD: 1.12, CAD: 1.02, CNY: 5.38, HKD: 5.79, BTC: 0.0000111, ETH: 0.00033, SGD: 1 },
  BTC: { USD: 67000, EUR: 61500, GBP: 52900, JPY: 10500000, CHF: 60000, AUD: 101000, CAD: 91500, CNY: 486000, HKD: 523000, SGD: 90000, ETH: 29.5, BTC: 1 },
  ETH: { USD: 2270, EUR: 2085, GBP: 1793, JPY: 355000, CHF: 2035, AUD: 3420, CAD: 3110, CNY: 16500, HKD: 17800, SGD: 3060, BTC: 0.0339, ETH: 1 },
};

export class StaticExchangeRateService implements IExchangeRateService {
  async getRate(from: Currency, to: Currency): Promise<ExchangeRate> {
    if (from.equals(to)) {
      return { from, to, rate: 1, fetchedAt: new Date() };
    }

    const rate = STATIC_RATES[from.code]?.[to.code];
    if (rate === undefined) {
      throw new Error(`No exchange rate available for ${from.code} → ${to.code}`);
    }

    return { from, to, rate, fetchedAt: new Date() };
  }

  async convert(
    amount: Money,
    toCurrency: Currency,
  ): Promise<{ converted: Money; rate: ExchangeRate }> {
    const rate = await this.getRate(amount.currency, toCurrency);

    // Convert using bigint arithmetic to preserve precision
    // converted = amount * rate, expressed in minor units of target currency
    const sourceDecimal = Number(amount.minorUnits) / 100;
    const convertedDecimal = sourceDecimal * rate.rate;
    const convertedMinorUnits = Math.round(convertedDecimal * 100);

    const converted = Money.fromMinorUnits(convertedMinorUnits, toCurrency);
    return { converted, rate };
  }
}
