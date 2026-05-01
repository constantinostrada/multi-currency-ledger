import { ExchangeRate } from "../../domain/exchange-rate";
import { Currency } from "../../domain/types";

function makeRate(overrides: Partial<ConstructorParameters<typeof ExchangeRate>[0]> = {}): ExchangeRate {
  return new ExchangeRate({
    id: "rate-1",
    fromCurrency: Currency.of("USD"),
    toCurrency: Currency.of("EUR"),
    rate: 0.92,
    effectiveAt: new Date("2026-04-01T00:00:00Z"),
    createdAt: new Date("2026-04-01T00:00:00Z"),
    ...overrides,
  });
}

describe("ExchangeRate entity", () => {
  it("constructs with all required fields", () => {
    const r = makeRate();
    expect(r.id).toBe("rate-1");
    expect(r.fromCurrency.code).toBe("USD");
    expect(r.toCurrency.code).toBe("EUR");
    expect(r.rate).toBe(0.92);
    expect(r.effectiveAt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(r.createdAt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("rejects an empty id", () => {
    expect(() => makeRate({ id: "" })).toThrow(/id/);
    expect(() => makeRate({ id: "   " })).toThrow(/id/);
  });

  it("rejects same-currency pair", () => {
    const usd = Currency.of("USD");
    expect(() => makeRate({ fromCurrency: usd, toCurrency: usd })).toThrow(/differ/i);
  });

  it("rejects a non-positive or non-finite rate", () => {
    expect(() => makeRate({ rate: 0 })).toThrow(/rate/);
    expect(() => makeRate({ rate: -1 })).toThrow(/rate/);
    expect(() => makeRate({ rate: Number.NaN })).toThrow(/rate/);
    expect(() => makeRate({ rate: Number.POSITIVE_INFINITY })).toThrow(/rate/);
  });

  it("rejects invalid effectiveAt or createdAt", () => {
    expect(() => makeRate({ effectiveAt: new Date("not-a-date") })).toThrow(/effectiveAt/);
    expect(() => makeRate({ createdAt: new Date("not-a-date") })).toThrow(/createdAt/);
  });

  it("is immutable: properties cannot be reassigned at runtime", () => {
    const r = makeRate();
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => {
      // @ts-expect-error verifying runtime immutability
      r.rate = 1.23;
    }).toThrow(TypeError);
    expect(r.rate).toBe(0.92);
  });

  it("does not expose any public method (temporal lookups belong to the repository)", () => {
    const r = makeRate();
    const proto = Object.getPrototypeOf(r) as object;
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== "constructor" && typeof (r as unknown as Record<string, unknown>)[n] === "function",
    );
    expect(methodNames).toEqual([]);
  });

  it("defensive-copies effectiveAt and createdAt so external mutation does not leak in", () => {
    const eff = new Date("2026-04-01T00:00:00Z");
    const created = new Date("2026-04-01T00:00:00Z");
    const r = makeRate({ effectiveAt: eff, createdAt: created });
    eff.setFullYear(1970);
    created.setFullYear(1970);
    expect(r.effectiveAt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(r.createdAt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});
