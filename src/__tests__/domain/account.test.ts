import { Account } from "../../domain/account";
import { Currency, Money, OwnerId } from "../../domain/types";

function makeAccount(overrides: Partial<ConstructorParameters<typeof Account>[0]> = {}): Account {
  const usd = Currency.of("USD");
  return new Account({
    id: "11111111-1111-4111-8111-111111111111",
    ownerId: OwnerId("owner-1"),
    currency: usd,
    balance: Money.of("100.00", usd),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  });
}

describe("Account entity", () => {
  it("constructs with all required fields", () => {
    const acc = makeAccount();
    expect(acc.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(acc.ownerId).toBe("owner-1");
    expect(acc.currency.code).toBe("USD");
    expect(acc.balance.toDecimalString()).toBe("100.00");
    expect(acc.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects an empty id", () => {
    expect(() => makeAccount({ id: "" })).toThrow(/id/);
    expect(() => makeAccount({ id: "   " })).toThrow(/id/);
  });

  it("rejects a balance whose currency does not match the account currency", () => {
    const eur = Currency.of("EUR");
    const usd = Currency.of("USD");
    expect(() =>
      makeAccount({ currency: usd, balance: Money.of("10.00", eur) }),
    ).toThrow(/currency/i);
  });

  it("rejects an invalid createdAt", () => {
    expect(() => makeAccount({ createdAt: new Date("not-a-date") })).toThrow(/createdAt/);
  });

  it("is immutable: properties cannot be reassigned at runtime", () => {
    const acc = makeAccount();
    expect(Object.isFrozen(acc)).toBe(true);
    expect(() => {
      // @ts-expect-error verifying runtime immutability of the public field
      acc.balance = Money.of("999.00", Currency.of("USD"));
    }).toThrow(TypeError);
    expect(acc.balance.toDecimalString()).toBe("100.00");
  });

  it("does not expose any public method that mutates balance", () => {
    const acc = makeAccount();
    const proto = Object.getPrototypeOf(acc) as object;
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== "constructor" && typeof (acc as unknown as Record<string, unknown>)[n] === "function",
    );
    expect(methodNames).toEqual([]);
  });

  it("defensive-copies createdAt so external mutation does not leak in", () => {
    const original = new Date("2026-01-01T00:00:00Z");
    const acc = makeAccount({ createdAt: original });
    original.setFullYear(1970);
    expect(acc.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
