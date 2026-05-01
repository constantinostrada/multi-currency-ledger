import { Transaction } from "../../domain/transaction";
import { Currency, IdempotencyKey, Money } from "../../domain/types";
import { TransactionType } from "../../domain/value-objects/TransactionType";

function makeTx(overrides: Partial<{
  id: string;
  accountId: string;
  type: TransactionType;
  amount: Money;
  currency: Currency;
  idempotencyKey: IdempotencyKey;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}> = {}): Transaction {
  const usd = Currency.of("USD");
  return new Transaction({
    id: overrides.id ?? "tx-1",
    accountId: overrides.accountId ?? "acc-1",
    type: overrides.type ?? TransactionType.CREDIT,
    amount: overrides.amount ?? Money.of("10.00", usd),
    currency: overrides.currency ?? usd,
    idempotencyKey: overrides.idempotencyKey ?? IdempotencyKey("idem-1"),
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    metadata: overrides.metadata,
  });
}

describe("Transaction entity", () => {
  it("constructs with valid props and exposes them as readonly fields", () => {
    const tx = makeTx({ metadata: { source: "test" } });
    expect(tx.id).toBe("tx-1");
    expect(tx.accountId).toBe("acc-1");
    expect(tx.type.isCredit()).toBe(true);
    expect(tx.amount.toDecimalString()).toBe("10.00");
    expect(tx.currency.code).toBe("USD");
    expect(tx.idempotencyKey).toBe("idem-1");
    expect(tx.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(tx.metadata).toEqual({ source: "test" });
  });

  it("is frozen — runtime reassignment of any field throws TypeError", () => {
    const tx = makeTx();
    expect(Object.isFrozen(tx)).toBe(true);
    expect(() => {
      // @ts-expect-error verifying runtime immutability
      tx.id = "different";
    }).toThrow(TypeError);
    expect(() => {
      // @ts-expect-error verifying runtime immutability
      tx.accountId = "other-acc";
    }).toThrow(TypeError);
  });

  it("defensive-copies createdAt so external mutation cannot leak in", () => {
    const original = new Date("2026-01-01T00:00:00Z");
    const tx = makeTx({ createdAt: original });
    original.setFullYear(1999);
    expect(tx.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("freezes metadata and decouples it from the input object", () => {
    const meta: Record<string, unknown> = { ref: "abc" };
    const tx = makeTx({ metadata: meta });
    meta.ref = "mutated";
    expect(tx.metadata?.ref).toBe("abc");
    expect(Object.isFrozen(tx.metadata)).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(() => makeTx({ id: "" })).toThrow(/Transaction\.id/);
    expect(() => makeTx({ id: "   " })).toThrow(/Transaction\.id/);
  });

  it("rejects an empty accountId", () => {
    expect(() => makeTx({ accountId: "" })).toThrow(/Transaction\.accountId/);
  });

  it("rejects a non-positive amount", () => {
    const usd = Currency.of("USD");
    expect(() => makeTx({ amount: Money.of("0", usd) })).toThrow(/positive/i);
  });

  it("rejects a currency mismatch between amount and the currency field", () => {
    const usd = Currency.of("USD");
    const eur = Currency.of("EUR");
    expect(() => makeTx({ amount: Money.of("10.00", usd), currency: eur })).toThrow(
      /currency/i,
    );
  });

  it("rejects an invalid Date for createdAt", () => {
    expect(() => makeTx({ createdAt: new Date("not-a-date") })).toThrow(/createdAt/);
  });

  it("supports DEBIT transactions as well as CREDIT", () => {
    const tx = makeTx({ type: TransactionType.DEBIT });
    expect(tx.type.isDebit()).toBe(true);
  });
});
