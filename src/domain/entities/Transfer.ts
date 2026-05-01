/**
 * Transfer — Entity
 *
 * Represents a cross-account (and optionally cross-currency) funds transfer.
 * Holds references to the two ledger entries it creates and, when cross-currency,
 * the exchange rate applied.
 */

import { Money } from "../value-objects/Money";

export type TransferStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface TransferProps {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: Money;
  destinationAmount: Money;
  /** Exchange rate applied (destinationAmount / sourceAmount), 1 for same-currency. */
  exchangeRate: number;
  status: TransferStatus;
  description: string;
  createdAt: Date;
  completedAt?: Date;
}

export class Transfer {
  private readonly _id: string;
  private readonly _sourceAccountId: string;
  private readonly _destinationAccountId: string;
  private readonly _sourceAmount: Money;
  private readonly _destinationAmount: Money;
  private readonly _exchangeRate: number;
  private _status: TransferStatus;
  private readonly _description: string;
  private readonly _createdAt: Date;
  private _completedAt: Date | undefined;

  constructor(props: TransferProps) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("Transfer id must not be empty.");
    }
    if (props.sourceAccountId === props.destinationAccountId) {
      throw new Error("Source and destination accounts must be different.");
    }
    if (!props.sourceAmount.isPositive() || !props.destinationAmount.isPositive()) {
      throw new Error("Transfer amounts must be positive.");
    }
    if (props.exchangeRate <= 0) {
      throw new Error("Exchange rate must be positive.");
    }

    this._id = props.id;
    this._sourceAccountId = props.sourceAccountId;
    this._destinationAccountId = props.destinationAccountId;
    this._sourceAmount = props.sourceAmount;
    this._destinationAmount = props.destinationAmount;
    this._exchangeRate = props.exchangeRate;
    this._status = props.status;
    this._description = props.description;
    this._createdAt = props.createdAt;
    this._completedAt = props.completedAt;
  }

  get id(): string {
    return this._id;
  }

  get sourceAccountId(): string {
    return this._sourceAccountId;
  }

  get destinationAccountId(): string {
    return this._destinationAccountId;
  }

  get sourceAmount(): Money {
    return this._sourceAmount;
  }

  get destinationAmount(): Money {
    return this._destinationAmount;
  }

  get exchangeRate(): number {
    return this._exchangeRate;
  }

  get status(): TransferStatus {
    return this._status;
  }

  get description(): string {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get isCrossCurrency(): boolean {
    return !this._sourceAmount.currency.equals(this._destinationAmount.currency);
  }

  complete(): void {
    if (this._status !== "PENDING") {
      throw new Error(`Cannot complete a transfer with status "${this._status}".`);
    }
    this._status = "COMPLETED";
    this._completedAt = new Date();
  }

  fail(): void {
    if (this._status !== "PENDING") {
      throw new Error(`Cannot fail a transfer with status "${this._status}".`);
    }
    this._status = "FAILED";
    this._completedAt = new Date();
  }
}
