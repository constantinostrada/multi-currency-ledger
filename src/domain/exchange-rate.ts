/**
 * ExchangeRate — Domain Entity (multi-currency ledger).
 *
 * A historical observation of the rate between two distinct currencies at a
 * specific moment (`effectiveAt`). Externally read-only; temporal lookups are
 * the repository's responsibility.
 */

import { Currency } from "./types";

export interface ExchangeRateProps {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  effectiveAt: Date;
  createdAt: Date;
}

export class ExchangeRate {
  readonly id: string;
  readonly fromCurrency: Currency;
  readonly toCurrency: Currency;
  readonly rate: number;
  readonly effectiveAt: Date;
  readonly createdAt: Date;

  constructor(props: ExchangeRateProps) {
    if (typeof props.id !== "string" || props.id.trim() === "") {
      throw new Error("ExchangeRate.id must be a non-empty string.");
    }
    if (props.fromCurrency.equals(props.toCurrency)) {
      throw new Error(
        `ExchangeRate.fromCurrency and toCurrency must differ ` +
          `(both were ${props.fromCurrency.code}).`,
      );
    }
    if (typeof props.rate !== "number" || !Number.isFinite(props.rate) || props.rate <= 0) {
      throw new Error("ExchangeRate.rate must be a finite positive number.");
    }
    if (!(props.effectiveAt instanceof Date) || Number.isNaN(props.effectiveAt.getTime())) {
      throw new Error("ExchangeRate.effectiveAt must be a valid Date.");
    }
    if (!(props.createdAt instanceof Date) || Number.isNaN(props.createdAt.getTime())) {
      throw new Error("ExchangeRate.createdAt must be a valid Date.");
    }

    this.id = props.id;
    this.fromCurrency = props.fromCurrency;
    this.toCurrency = props.toCurrency;
    this.rate = props.rate;
    this.effectiveAt = new Date(props.effectiveAt.getTime());
    this.createdAt = new Date(props.createdAt.getTime());

    Object.freeze(this);
  }
}
