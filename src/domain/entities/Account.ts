/**
 * Account — Entity
 *
 * Represents a ledger account that holds a balance in a single currency.
 * Enforces its own invariants: balance can go negative only if overdraft is allowed.
 */

import { Currency } from "../value-objects/Currency";
import { Money } from "../value-objects/Money";

export interface AccountProps {
  id: string;
  ownerId: string;
  name: string;
  currency: Currency;
  balanceMinorUnits: bigint;
  allowOverdraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Account {
  private readonly _id: string;
  private readonly _ownerId: string;
  private _name: string;
  private readonly _currency: Currency;
  private _balanceMinorUnits: bigint;
  private readonly _allowOverdraft: boolean;
  private _updatedAt: Date;
  private readonly _createdAt: Date;

  constructor(props: AccountProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("Account id must not be empty.");
    }
    if (!props.ownerId || props.ownerId.trim() === "") {
      throw new Error("Account ownerId must not be empty.");
    }
    if (!props.name || props.name.trim() === "") {
      throw new Error("Account name must not be empty.");
    }

    this._id = props.id;
    this._ownerId = props.ownerId;
    this._name = props.name.trim();
    this._currency = props.currency;
    this._balanceMinorUnits = props.balanceMinorUnits;
    this._allowOverdraft = props.allowOverdraft;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get name(): string {
    return this._name;
  }

  get currency(): Currency {
    return this._currency;
  }

  get balance(): Money {
    return Money.fromMinorUnits(this._balanceMinorUnits, this._currency);
  }

  get allowOverdraft(): boolean {
    return this._allowOverdraft;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Domain Behaviour ────────────────────────────────────────────────────────

  /**
   * Credit the account (add funds).
   * Amount must be positive and in the same currency.
   */
  credit(amount: Money): void {
    this.assertSameCurrency(amount);
    if (!amount.isPositive()) {
      throw new Error("Credit amount must be positive.");
    }
    this._balanceMinorUnits += amount.minorUnits;
    this.touch();
  }

  /**
   * Debit the account (remove funds).
   * Amount must be positive, same currency, and balance must be sufficient
   * unless overdraft is enabled.
   */
  debit(amount: Money): void {
    this.assertSameCurrency(amount);
    if (!amount.isPositive()) {
      throw new Error("Debit amount must be positive.");
    }
    const newBalance = this._balanceMinorUnits - amount.minorUnits;
    if (newBalance < 0n && !this._allowOverdraft) {
      throw new Error(
        `Insufficient funds in account "${this._name}". ` +
          `Balance: ${this.balance}, attempted debit: ${amount}`,
      );
    }
    this._balanceMinorUnits = newBalance;
    this.touch();
  }

  rename(newName: string): void {
    if (!newName || newName.trim() === "") {
      throw new Error("Account name must not be empty.");
    }
    this._name = newName.trim();
    this.touch();
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private assertSameCurrency(money: Money): void {
    if (!this._currency.equals(money.currency)) {
      throw new Error(
        `Currency mismatch: account is ${this._currency.code}, got ${money.currency.code}`,
      );
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
