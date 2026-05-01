import { InMemoryExchangeRateRepository } from "../../infrastructure/in-memory-exchange-rate-repository";
import { ExchangeRate } from "../../domain/exchange-rate";
import { IExchangeRateRepository } from "../../domain/exchange-rate-repository";
import { Currency } from "../../domain/types";
import * as fs from "fs";
import * as path from "path";

function makeRate(opts: {
  id: string;
  from?: string;
  to?: string;
  rate?: number;
  effectiveAt: string;
  createdAt?: string;
}): ExchangeRate {
  return new ExchangeRate({
    id: opts.id,
    fromCurrency: Currency.of(opts.from ?? "USD"),
    toCurrency: Currency.of(opts.to ?? "EUR"),
    rate: opts.rate ?? 1,
    effectiveAt: new Date(opts.effectiveAt),
    createdAt: new Date(opts.createdAt ?? opts.effectiveAt),
  });
}

describe("InMemoryExchangeRateRepository", () => {
  let repo: IExchangeRateRepository;

  beforeEach(() => {
    repo = new InMemoryExchangeRateRepository();
  });

  describe("findLatestApplicable", () => {
    it("returns the correct rate given an arbitrary asOf within the timeline", async () => {
      await repo.append(makeRate({ id: "r1", rate: 0.90, effectiveAt: "2026-01-01T00:00:00Z" }));
      await repo.append(makeRate({ id: "r2", rate: 0.92, effectiveAt: "2026-02-01T00:00:00Z" }));
      await repo.append(makeRate({ id: "r3", rate: 0.95, effectiveAt: "2026-03-01T00:00:00Z" }));

      const usd = Currency.of("USD");
      const eur = Currency.of("EUR");

      // asOf strictly between r1 and r2 → r1
      const a = await repo.findLatestApplicable(usd, eur, new Date("2026-01-15T00:00:00Z"));
      expect(a?.id).toBe("r1");
      expect(a?.rate).toBe(0.90);

      // asOf exactly equal to r2.effectiveAt → r2 (boundary inclusive)
      const b = await repo.findLatestApplicable(usd, eur, new Date("2026-02-01T00:00:00Z"));
      expect(b?.id).toBe("r2");

      // asOf after every observation → r3
      const c = await repo.findLatestApplicable(usd, eur, new Date("2026-04-01T00:00:00Z"));
      expect(c?.id).toBe("r3");
    });

    it("returns null when no rate is applicable for the given asOf", async () => {
      const usd = Currency.of("USD");
      const eur = Currency.of("EUR");

      // empty repository
      expect(await repo.findLatestApplicable(usd, eur, new Date("2026-01-01T00:00:00Z"))).toBeNull();

      // only a future rate exists, asOf is before it
      await repo.append(makeRate({ id: "r-future", effectiveAt: "2026-06-01T00:00:00Z" }));
      const beforeAny = await repo.findLatestApplicable(usd, eur, new Date("2026-01-01T00:00:00Z"));
      expect(beforeAny).toBeNull();

      // wrong direction (EUR→USD when we only stored USD→EUR)
      await repo.append(makeRate({ id: "r-usd-eur", effectiveAt: "2026-01-01T00:00:00Z" }));
      const wrongDirection = await repo.findLatestApplicable(
        eur,
        usd,
        new Date("2026-12-31T00:00:00Z"),
      );
      expect(wrongDirection).toBeNull();

      // unrelated pair
      const gbp = Currency.of("GBP");
      const jpy = Currency.of("JPY");
      const unrelated = await repo.findLatestApplicable(gbp, jpy, new Date("2026-12-31T00:00:00Z"));
      expect(unrelated).toBeNull();
    });

    it("returns the most recent rate for the same pair within the asOf window across many entries", async () => {
      // Many observations for USD→EUR, plus noise for other pairs/directions.
      await repo.append(makeRate({ id: "u1", rate: 0.80, effectiveAt: "2025-06-01T00:00:00Z" }));
      await repo.append(makeRate({ id: "u2", rate: 0.85, effectiveAt: "2025-09-01T00:00:00Z" }));
      await repo.append(makeRate({ id: "u3", rate: 0.90, effectiveAt: "2026-01-01T00:00:00Z" }));
      await repo.append(makeRate({ id: "u4", rate: 0.92, effectiveAt: "2026-02-15T00:00:00Z" }));
      await repo.append(makeRate({ id: "u5", rate: 0.95, effectiveAt: "2026-04-01T00:00:00Z" }));
      // Reverse direction noise — must not match.
      await repo.append(
        makeRate({ id: "rev1", from: "EUR", to: "USD", rate: 1.10, effectiveAt: "2026-03-01T00:00:00Z" }),
      );
      // Different pair noise.
      await repo.append(
        makeRate({ id: "gbp1", from: "GBP", to: "EUR", rate: 1.15, effectiveAt: "2026-03-01T00:00:00Z" }),
      );
      // Insertion-order tie-breaker: same effectiveAt as u4, appended later → wins on equal cutoff.
      await repo.append(
        makeRate({ id: "u4-tie", rate: 0.93, effectiveAt: "2026-02-15T00:00:00Z" }),
      );

      const usd = Currency.of("USD");
      const eur = Currency.of("EUR");

      // Window cutting between u3 and u4 → u3 is the most recent applicable.
      const within = await repo.findLatestApplicable(usd, eur, new Date("2026-01-31T23:59:59Z"));
      expect(within?.id).toBe("u3");
      expect(within?.rate).toBe(0.90);

      // Window exactly at u4.effectiveAt → u4-tie (latest appended at equal effectiveAt).
      const tie = await repo.findLatestApplicable(usd, eur, new Date("2026-02-15T00:00:00Z"));
      expect(tie?.id).toBe("u4-tie");
      expect(tie?.rate).toBe(0.93);

      // Window after every USD→EUR observation → u5.
      const latest = await repo.findLatestApplicable(usd, eur, new Date("2026-12-31T00:00:00Z"));
      expect(latest?.id).toBe("u5");

      // Reverse direction is independent.
      const reverse = await repo.findLatestApplicable(eur, usd, new Date("2026-12-31T00:00:00Z"));
      expect(reverse?.id).toBe("rev1");
    });

    it("rebuilds a fresh frozen ExchangeRate on every read so callers cannot mutate stored state", async () => {
      await repo.append(makeRate({ id: "r1", rate: 0.90, effectiveAt: "2026-01-01T00:00:00Z" }));
      const usd = Currency.of("USD");
      const eur = Currency.of("EUR");
      const a = await repo.findLatestApplicable(usd, eur, new Date("2026-12-31T00:00:00Z"));
      const b = await repo.findLatestApplicable(usd, eur, new Date("2026-12-31T00:00:00Z"));
      expect(a).not.toBe(b);
      expect(Object.isFrozen(a)).toBe(true);
      expect(Object.isFrozen(b)).toBe(true);
    });

    it("throws when asOf is not a valid Date", async () => {
      const usd = Currency.of("USD");
      const eur = Currency.of("EUR");
      await expect(repo.findLatestApplicable(usd, eur, new Date("not-a-date"))).rejects.toThrow(
        /asOf/i,
      );
    });
  });

  describe("append-only contract", () => {
    it("the IExchangeRateRepository interface declares only `append` and `findLatestApplicable` — no update/delete", () => {
      // Static check on the interface declaration itself.
      const interfaceFile = path.resolve(
        __dirname,
        "..",
        "..",
        "domain",
        "exchange-rate-repository.ts",
      );
      const src = fs.readFileSync(interfaceFile, "utf-8");

      // Extract method signatures inside the IExchangeRateRepository interface body.
      const ifaceMatch = src.match(/export\s+interface\s+IExchangeRateRepository\s*\{([\s\S]*?)\n\}/);
      expect(ifaceMatch).not.toBeNull();
      const body = ifaceMatch![1]!;

      const stripped = body
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      const methodNameRegex = /(^|;|\{|\n)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
      const declared = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = methodNameRegex.exec(stripped)) !== null) {
        declared.add(m[2]!);
      }

      expect([...declared].sort()).toEqual(["append", "findLatestApplicable"]);

      // And no forbidden surface verbs anywhere in the interface declaration.
      const forbidden = ["update", "delete", "remove", "save", "upsert", "replace"];
      for (const verb of forbidden) {
        expect(stripped.toLowerCase()).not.toContain(verb);
      }
    });

    it("the InMemoryExchangeRateRepository implementation exposes only append and findLatestApplicable on its prototype", () => {
      const repoImpl = new InMemoryExchangeRateRepository();
      const proto = Object.getPrototypeOf(repoImpl) as object;
      const methodNames = Object.getOwnPropertyNames(proto)
        .filter(
          (n) =>
            n !== "constructor" &&
            typeof (repoImpl as unknown as Record<string, unknown>)[n] === "function",
        )
        .sort();
      expect(methodNames).toEqual(["append", "findLatestApplicable"]);
    });

    it("structurally implements IExchangeRateRepository", () => {
      const r: IExchangeRateRepository = new InMemoryExchangeRateRepository();
      expect(typeof r.append).toBe("function");
      expect(typeof r.findLatestApplicable).toBe("function");
    });
  });
});

describe("InMemoryExchangeRateRepository — layering", () => {
  it("the IExchangeRateRepository contract lives in domain/ and imports nothing from infrastructure", () => {
    const file = path.resolve(__dirname, "..", "..", "domain", "exchange-rate-repository.ts");
    const src = fs.readFileSync(file, "utf-8");
    const importRegex = /import\s+[^'"`]+from\s*['"`]([^'"`]+)['"`]/g;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(src)) !== null) {
      const spec = m[1];
      if (spec === undefined) continue;
      const isRelative = spec.startsWith(".") || spec.startsWith("/");
      const isInfraAlias = spec.startsWith("@/infrastructure") || spec.startsWith("@/interfaces");
      if (!isRelative || isInfraAlias) {
        offenders.push(spec);
      }
    }
    expect(offenders).toEqual([]);
  });
});
