/**
 * Account — Domain Entity (clean rebuild for the multi-currency ledger).
 *
 * Holds a balance in a single currency for one owner. Externally observable
 * state is read-only: balance can only change through the repository's
 * `updateBalance` operation. Pure TypeScript; no third-party imports.
 */

import { Currency, Money, OwnerId } from "./types";

export interface AccountProps {
  id: string;
  ownerId: OwnerId;
  currency: Currency;
  balance: Money;
  createdAt: Date;
}

export class Account {
  readonly id: string;
  readonly ownerId: OwnerId;
  readonly currency: Currency;
  readonly balance: Money;
  readonly createdAt: Date;

  constructor(props: AccountProps) {
    if (typeof props.id !== "string" || props.id.trim() === "") {
      throw new Error("Account.id must be a non-empty string.");
    }
    if (!props.balance.currency.equals(props.currency)) {
      throw new Error(
        `Account balance currency (${props.balance.currency.code}) ` +
          `does not match account currency (${props.currency.code}).`,
      );
    }
    if (!(props.createdAt instanceof Date) || Number.isNaN(props.createdAt.getTime())) {
      throw new Error("Account.createdAt must be a valid Date.");
    }

    this.id = props.id;
    this.ownerId = props.ownerId;
    this.currency = props.currency;
    this.balance = props.balance;
    this.createdAt = new Date(props.createdAt.getTime());

    Object.freeze(this);
  }
}
