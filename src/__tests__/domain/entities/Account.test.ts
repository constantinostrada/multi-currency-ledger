import { Account } from "../../../domain/entities/Account";
import { Currency } from "../../../domain/value-objects/Currency";
import { Money } from "../../../domain/value-objects/Money";

function makeAccount(overrides: Partial<ConstructorParameters<typeof Account>[0]> = {}): Account {
  const usd = Currency.of("USD");
  const now = new Date("2024-01-01T00:00:00Z");
  return new Account({
    id: "acc-1",
    ownerId: "owner-1",
    name: "Checking",
    currency: usd,
    balanceMinorUnits: 10000n, // $100.00
    allowOverdraft: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("Account", () => {
  describe("construction", () => {
    it("creates successfully with valid props", () => {
      const acc = makeAccount();
      expect(acc.id).toBe("acc-1");
      expect(acc.balance.toDecimalString()).toBe("100.00");
    });

    it("throws if id is empty", () => {
      expect(() => makeAccount({ id: "" })).toThrow("id must not be empty");
    });

    it("throws if name is empty", () => {
      expect(() => makeAccount({ name: "  " })).toThrow("name must not be empty");
    });
  });

  describe("credit()", () => {
    it("increases balance by the credited amount", () => {
      const acc = makeAccount();
      const usd = Currency.of("USD");
      acc.credit(Money.of("50.00", usd));
      expect(acc.balance.toDecimalString()).toBe("150.00");
    });

    it("throws if credit amount is not positive", () => {
      const acc = makeAccount();
      const usd = Currency.of("USD");
      expect(() => acc.credit(Money.of("0.00", usd))).toThrow("must be positive");
    });

    it("throws on currency mismatch", () => {
      const acc = makeAccount();
      const eur = Currency.of("EUR");
      expect(() => acc.credit(Money.of("10.00", eur))).toThrow("Currency mismatch");
    });
  });

  describe("debit()", () => {
    it("decreases balance by the debited amount", () => {
      const acc = makeAccount();
      const usd = Currency.of("USD");
      acc.debit(Money.of("30.00", usd));
      expect(acc.balance.toDecimalString()).toBe("70.00");
    });

    it("throws on insufficient funds when overdraft not allowed", () => {
      const acc = makeAccount({ allowOverdraft: false });
      const usd = Currency.of("USD");
      expect(() => acc.debit(Money.of("200.00", usd))).toThrow("Insufficient funds");
    });

    it("allows overdraft when explicitly enabled", () => {
      const acc = makeAccount({ allowOverdraft: true });
      const usd = Currency.of("USD");
      acc.debit(Money.of("200.00", usd));
      expect(acc.balance.isNegative()).toBe(true);
    });
  });

  describe("rename()", () => {
    it("updates the name", () => {
      const acc = makeAccount();
      acc.rename("Savings");
      expect(acc.name).toBe("Savings");
    });

    it("throws if new name is empty", () => {
      const acc = makeAccount();
      expect(() => acc.rename("")).toThrow("must not be empty");
    });
  });
});
