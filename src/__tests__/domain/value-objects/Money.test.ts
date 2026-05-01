import { Currency } from "../../../domain/value-objects/Currency";
import { Money } from "../../../domain/value-objects/Money";

describe("Money", () => {
  const usd = Currency.of("USD");
  const eur = Currency.of("EUR");

  describe("Money.of()", () => {
    it("parses a decimal string correctly", () => {
      const m = Money.of("10.50", usd);
      expect(m.minorUnits).toBe(1050n);
      expect(m.currency.code).toBe("USD");
    });

    it("parses an integer string", () => {
      const m = Money.of("100", usd);
      expect(m.minorUnits).toBe(10000n);
    });

    it("parses a number", () => {
      const m = Money.of(5.99, usd);
      expect(m.minorUnits).toBe(599n);
    });

    it("handles zero", () => {
      const m = Money.of("0.00", usd);
      expect(m.isZero()).toBe(true);
    });
  });

  describe("add()", () => {
    it("adds two amounts of the same currency", () => {
      const a = Money.of("10.00", usd);
      const b = Money.of("5.50", usd);
      expect(a.add(b).minorUnits).toBe(1550n);
    });

    it("throws when currencies differ", () => {
      const a = Money.of("10.00", usd);
      const b = Money.of("10.00", eur);
      expect(() => a.add(b)).toThrow("Currency mismatch");
    });
  });

  describe("subtract()", () => {
    it("subtracts and can go negative", () => {
      const a = Money.of("5.00", usd);
      const b = Money.of("10.00", usd);
      expect(a.subtract(b).isNegative()).toBe(true);
    });
  });

  describe("equals()", () => {
    it("is equal when same amount and currency", () => {
      expect(Money.of("10.00", usd).equals(Money.of("10.00", usd))).toBe(true);
    });

    it("is not equal with different amounts", () => {
      expect(Money.of("10.00", usd).equals(Money.of("10.01", usd))).toBe(false);
    });

    it("is not equal with different currencies", () => {
      expect(Money.of("10.00", usd).equals(Money.of("10.00", eur))).toBe(false);
    });
  });

  describe("toDecimalString()", () => {
    it("formats correctly", () => {
      expect(Money.of("1234.56", usd).toDecimalString()).toBe("1234.56");
    });

    it("formats zero", () => {
      expect(Money.of("0.00", usd).toDecimalString()).toBe("0.00");
    });
  });
});
