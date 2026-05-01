/**
 * LedgerEntry — Entity
 *
 * An immutable record of a single credit or debit applied to an account.
 * Once created, a ledger entry must never be mutated (append-only audit log).
 */

import { Money } from "../value-objects/Money";
import { TransactionType } from "../value-objects/TransactionType";

export interface LedgerEntryProps {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: Money;
  description: string;
  referenceId?: string; // e.g. external transaction or transfer ID
  createdAt: Date;
}

export class LedgerEntry {
  private readonly _id: string;
  private readonly _accountId: string;
  private readonly _type: TransactionType;
  private readonly _amount: Money;
  private readonly _description: string;
  private readonly _referenceId: string | undefined;
  private readonly _createdAt: Date;

  constructor(props: LedgerEntryProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("LedgerEntry id must not be empty.");
    }
    if (!props.accountId || props.accountId.trim() === "") {
      throw new Error("LedgerEntry accountId must not be empty.");
    }
    if (!props.amount.isPositive()) {
      throw new Error("LedgerEntry amount must be positive.");
    }
    if (!props.description || props.description.trim() === "") {
      throw new Error("LedgerEntry description must not be empty.");
    }

    this._id = props.id;
    this._accountId = props.accountId;
    this._type = props.type;
    this._amount = props.amount;
    this._description = props.description.trim();
    this._referenceId = props.referenceId;
    this._createdAt = props.createdAt;
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get type(): TransactionType {
    return this._type;
  }

  get amount(): Money {
    return this._amount;
  }

  get description(): string {
    return this._description;
  }

  get referenceId(): string | undefined {
    return this._referenceId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
