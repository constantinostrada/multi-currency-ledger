import { Currency } from "../../../domain/value-objects/Currency";

describe("Currency", () => {
  it("creates a valid currency from a supported code", () => {
    const c = Currency.of("USD");
    expect(c.code).toBe("USD");
  });

  it("is case-insensitive", () => {
    const c = Currency.of("eur");
    expect(c.code).toBe("EUR");
  });

  it("throws for unsupported codes", () => {
    expect(() => Currency.of("XYZ")).toThrow("Unsupported currency code");
  });

  it("equals() returns true for same code", () => {
    expect(Currency.of("GBP").equals(Currency.of("GBP"))).toBe(true);
  });

  it("equals() returns false for different codes", () => {
    expect(Currency.of("USD").equals(Currency.of("EUR"))).toBe(false);
  });

  it("toString() returns the code", () => {
    expect(Currency.of("JPY").toString()).toBe("JPY");
  });
});
