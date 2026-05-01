/**
 * TransactionType — Value Object (enum-style)
 *
 * Represents whether a ledger entry is a CREDIT or DEBIT.
 */

export const TRANSACTION_TYPES = ["CREDIT", "DEBIT"] as const;
export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];

export class TransactionType {
  private readonly _value: TransactionTypeValue;

  private constructor(value: TransactionTypeValue) {
    this._value = value;
  }

  static CREDIT = new TransactionType("CREDIT");
  static DEBIT = new TransactionType("DEBIT");

  static of(value: string): TransactionType {
    const upper = value.toUpperCase();
    if (!TRANSACTION_TYPES.includes(upper as TransactionTypeValue)) {
      throw new Error(`Invalid transaction type: "${value}". Must be CREDIT or DEBIT.`);
    }
    return new TransactionType(upper as TransactionTypeValue);
  }

  get value(): TransactionTypeValue {
    return this._value;
  }

  isCredit(): boolean {
    return this._value === "CREDIT";
  }

  isDebit(): boolean {
    return this._value === "DEBIT";
  }

  equals(other: TransactionType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
