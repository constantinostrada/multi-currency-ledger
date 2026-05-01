/**
 * HttpExchangeRateService — Infrastructure Layer
 *
 * Production implementation of IExchangeRateService that fetches live rates
 * from an external HTTP API (e.g. exchangerate-api.com).
 *
 * Requires env vars:
 *   EXCHANGE_RATE_API_URL  — base URL
 *   EXCHANGE_RATE_API_KEY  — API key
 *
 * Infrastructure errors are caught and re-thrown as domain-friendly errors.
 */

import { Currency } from "@/domain/value-objects/Currency";
import { Money } from "@/domain/value-objects/Money";
import {
  ExchangeRate,
  IExchangeRateService,
} from "@/domain/services/ExchangeRateService";

interface ExchangeRateApiResponse {
  base: string;
  rates: Record<string, number>;
}

export class HttpExchangeRateService implements IExchangeRateService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    const url = process.env["EXCHANGE_RATE_API_URL"];
    const key = process.env["EXCHANGE_RATE_API_KEY"];
    if (!url || !key) {
      throw new Error(
        "HttpExchangeRateService requires EXCHANGE_RATE_API_URL and EXCHANGE_RATE_API_KEY env vars.",
      );
    }
    this.apiUrl = url;
    this.apiKey = key;
  }

  async getRate(from: Currency, to: Currency): Promise<ExchangeRate> {
    if (from.equals(to)) {
      return { from, to, rate: 1, fetchedAt: new Date() };
    }

    let data: ExchangeRateApiResponse;
    try {
      const res = await fetch(`${this.apiUrl}/${this.apiKey}/latest/${from.code}`);
      if (!res.ok) {
        throw new Error(`Exchange rate API responded with status ${res.status}`);
      }
      data = (await res.json()) as ExchangeRateApiResponse;
    } catch (err) {
      throw new Error(
        `Failed to fetch exchange rate ${from.code} → ${to.code}: ${String(err)}`,
      );
    }

    const rate = data.rates[to.code];
    if (rate === undefined) {
      throw new Error(`Exchange rate API did not return a rate for ${to.code}`);
    }

    return { from, to, rate, fetchedAt: new Date() };
  }

  async convert(
    amount: Money,
    toCurrency: Currency,
  ): Promise<{ converted: Money; rate: ExchangeRate }> {
    const rate = await this.getRate(amount.currency, toCurrency);
    const sourceDecimal = Number(amount.minorUnits) / 100;
    const convertedDecimal = sourceDecimal * rate.rate;
    const convertedMinorUnits = Math.round(convertedDecimal * 100);
    const converted = Money.fromMinorUnits(convertedMinorUnits, toCurrency);
    return { converted, rate };
  }
}
