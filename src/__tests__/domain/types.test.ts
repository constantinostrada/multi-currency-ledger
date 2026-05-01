import * as DomainTypes from "../../domain/types";
import { Currency, Money, OwnerId, IdempotencyKey } from "../../domain/types";
import * as fs from "fs";
import * as path from "path";

describe("Domain types module (src/domain/types.ts)", () => {
  it("exports Currency, Money, OwnerId, and IdempotencyKey", () => {
    expect(DomainTypes).toHaveProperty("Currency");
    expect(DomainTypes).toHaveProperty("Money");
    expect(DomainTypes).toHaveProperty("OwnerId");
    expect(DomainTypes).toHaveProperty("IdempotencyKey");
  });

  it("Currency.of returns a Currency instance", () => {
    const usd = Currency.of("USD");
    expect(usd).toBeInstanceOf(Currency);
    expect(usd.code).toBe("USD");
  });

  it("Money.of returns a Money instance", () => {
    const usd = Currency.of("USD");
    const m = Money.of("1.00", usd);
    expect(m).toBeInstanceOf(Money);
    expect(m.minorUnits).toBe(100n);
  });

  it("OwnerId factory accepts a non-empty string and returns the value", () => {
    const id = OwnerId("owner-1");
    expect(id).toBe("owner-1");
  });

  it("OwnerId factory rejects empty strings", () => {
    expect(() => OwnerId("")).toThrow();
    expect(() => OwnerId("   ")).toThrow();
  });

  it("IdempotencyKey factory accepts a non-empty string and returns the value", () => {
    const key = IdempotencyKey("req-42");
    expect(key).toBe("req-42");
  });

  it("IdempotencyKey factory rejects empty strings", () => {
    expect(() => IdempotencyKey("")).toThrow();
    expect(() => IdempotencyKey("   ")).toThrow();
  });
});

describe("Domain layer purity (no external framework imports)", () => {
  const domainDir = path.resolve(__dirname, "..", "..", "domain");

  function listTsFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...listTsFiles(full));
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        out.push(full);
      }
    }
    return out;
  }

  const forbiddenSpecifiers = [
    "next",
    "next/server",
    "next/headers",
    "express",
    "@nestjs/common",
    "react",
    "fastify",
    "koa",
    "@prisma/client",
    "typeorm",
    "sequelize",
    "mongoose",
  ];

  const files = listTsFiles(domainDir);

  it("the domain directory contains TypeScript files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s has zero forbidden framework imports", (file) => {
    const src = fs.readFileSync(file, "utf-8");
    const importRegex = /(?:import|require)\s*(?:[^'"`]*from\s*)?['"`]([^'"`]+)['"`]/g;
    const offenders: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(src)) !== null) {
      const specifier = match[1];
      if (specifier === undefined) continue;
      if (forbiddenSpecifiers.includes(specifier)) {
        offenders.push(specifier);
        continue;
      }
      // Disallow non-relative, non-aliased imports — those are third-party.
      const isRelative = specifier.startsWith(".") || specifier.startsWith("/");
      if (!isRelative) {
        offenders.push(specifier);
      }
    }
    expect(offenders).toEqual([]);
  });
});
