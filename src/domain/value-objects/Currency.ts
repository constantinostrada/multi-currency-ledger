/**
 * Currency — Value Object
 *
 * Represents an ISO 4217 currency code (e.g. "USD", "EUR", "JPY").
 * Immutable; equality is by value.
 */

const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "CNY",
  "HKD",
  "SGD",
  "BTC",
  "ETH",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export class Currency {
  private readonly _code: CurrencyCode;

  private constructor(code: CurrencyCode) {
    this._code = code;
  }

  static of(code: string): Currency {
    const upper = code.toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(upper as CurrencyCode)) {
      throw new Error(
        `Unsupported currency code: "${code}". Supported: ${SUPPORTED_CURRENCIES.join(", ")}`,
      );
    }
    return new Currency(upper as CurrencyCode);
  }

  get code(): CurrencyCode {
    return this._code;
  }

  equals(other: Currency): boolean {
    return this._code === other._code;
  }

  toString(): string {
    return this._code;
  }
}
