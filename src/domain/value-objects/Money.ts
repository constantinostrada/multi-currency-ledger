/**
 * Money — Value Object
 *
 * Represents an amount denominated in a specific currency.
 * All amounts are stored as integer minor units (e.g. cents for USD)
 * to avoid floating-point rounding errors.
 * Immutable; equality is by value.
 */

import { Currency } from "./Currency";

export class Money {
  /** Amount in the currency's smallest unit (e.g. cents for USD). */
  private readonly _minorUnits: bigint;
  private readonly _currency: Currency;

  private constructor(minorUnits: bigint, currency: Currency) {
    this._minorUnits = minorUnits;
    this._currency = currency;
  }

  /**
   * @param amount      Decimal string or number, e.g. "10.50" or 10.50
   * @param currency    Currency instance
   * @param decimals    Number of decimal places for this currency (default 2)
   */
  static of(amount: string | number, currency: Currency, decimals = 2): Money {
    const factor = 10n ** BigInt(decimals);
    const parsed = typeof amount === "string" ? amount : amount.toString();

    // Split into integer and fractional parts
    const [intPart = "0", fracPart = ""] = parsed.split(".");
    const paddedFrac = fracPart.padEnd(decimals, "0").slice(0, decimals);

    const minorUnits = BigInt(intPart) * factor + BigInt(paddedFrac);
    return new Money(minorUnits, currency);
  }

  /** Create from raw minor units (e.g. 1050 = $10.50). */
  static fromMinorUnits(minorUnits: bigint | number, currency: Currency): Money {
    return new Money(BigInt(minorUnits), currency);
  }

  get minorUnits(): bigint {
    return this._minorUnits;
  }

  get currency(): Currency {
    return this._currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._minorUnits + other._minorUnits, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._minorUnits - other._minorUnits, this._currency);
  }

  isPositive(): boolean {
    return this._minorUnits > 0n;
  }

  isNegative(): boolean {
    return this._minorUnits < 0n;
  }

  isZero(): boolean {
    return this._minorUnits === 0n;
  }

  equals(other: Money): boolean {
    return this._currency.equals(other._currency) && this._minorUnits === other._minorUnits;
  }

  /** Format as decimal string, e.g. "10.50". */
  toDecimalString(decimals = 2): string {
    const factor = 10n ** BigInt(decimals);
    const abs = this._minorUnits < 0n ? -this._minorUnits : this._minorUnits;
    const intPart = abs / factor;
    const fracPart = (abs % factor).toString().padStart(decimals, "0");
    const sign = this._minorUnits < 0n ? "-" : "";
    return `${sign}${intPart}.${fracPart}`;
  }

  toString(): string {
    return `${this.toDecimalString()} ${this._currency.code}`;
  }

  private assertSameCurrency(other: Money): void {
    if (!this._currency.equals(other._currency)) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this._currency.code} and ${other._currency.code}`,
      );
    }
  }
}
