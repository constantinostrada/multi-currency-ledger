import { InMemoryTransactionRepository } from "../../infrastructure/in-memory-transaction-repository";
import { Transaction } from "../../domain/transaction";
import { Currency, IdempotencyKey, Money } from "../../domain/types";
import { TransactionType } from "../../domain/value-objects/TransactionType";
import { DuplicateIdempotencyKeyError } from "../../domain/errors";
import { ITransactionRepository } from "../../domain/transaction-repository";
import * as fs from "fs";
import * as path from "path";

function makeTx(opts: {
  id: string;
  accountId?: string;
  type?: TransactionType;
  amount?: string;
  currency?: string;
  idempotencyKey?: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}): Transaction {
  const currency = Currency.of(opts.currency ?? "USD");
  return new Transaction({
    id: opts.id,
    accountId: opts.accountId ?? "acc-1",
    type: opts.type ?? TransactionType.CREDIT,
    amount: Money.of(opts.amount ?? "10.00", currency),
    currency,
    idempotencyKey: IdempotencyKey(opts.idempotencyKey ?? `idem-${opts.id}`),
    createdAt: opts.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    metadata: opts.metadata,
  });
}

describe("InMemoryTransactionRepository", () => {
  let repo: ITransactionRepository;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
  });

  describe("append", () => {
    it("persists a new transaction so it can be retrieved by account or idempotency key", async () => {
      const tx = makeTx({ id: "tx-1", idempotencyKey: "k-1" });
      await repo.append(tx);

      const list = await repo.findByAccountId("acc-1");
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe("tx-1");

      const byKey = await repo.findByIdempotencyKey(IdempotencyKey("k-1"));
      expect(byKey?.id).toBe("tx-1");
    });

    it("throws DuplicateIdempotencyKeyError when a transaction with the same idempotency key is appended", async () => {
      await repo.append(makeTx({ id: "tx-a", idempotencyKey: "same-key" }));

      const dup = makeTx({ id: "tx-b", idempotencyKey: "same-key" });
      await expect(repo.append(dup)).rejects.toBeInstanceOf(DuplicateIdempotencyKeyError);

      // Original is preserved; duplicate is not stored.
      const list = await repo.findByAccountId("acc-1");
      expect(list.map((t) => t.id)).toEqual(["tx-a"]);
    });

    it("throws when re-appending a transaction with an id that already exists", async () => {
      await repo.append(makeTx({ id: "tx-id-clash", idempotencyKey: "k-1" }));
      const dup = makeTx({ id: "tx-id-clash", idempotencyKey: "k-2" });
      await expect(repo.append(dup)).rejects.toThrow(/already exists/i);
    });
  });

  describe("findByAccountId", () => {
    beforeEach(async () => {
      await repo.append(
        makeTx({
          id: "t1",
          accountId: "acc-1",
          idempotencyKey: "k1",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        }),
      );
      await repo.append(
        makeTx({
          id: "t2",
          accountId: "acc-1",
          idempotencyKey: "k2",
          createdAt: new Date("2026-02-15T00:00:00Z"),
        }),
      );
      await repo.append(
        makeTx({
          id: "t3",
          accountId: "acc-1",
          idempotencyKey: "k3",
          createdAt: new Date("2026-03-31T00:00:00Z"),
        }),
      );
      await repo.append(
        makeTx({
          id: "t4",
          accountId: "acc-2",
          idempotencyKey: "k4",
          createdAt: new Date("2026-02-01T00:00:00Z"),
        }),
      );
    });

    it("returns only transactions for the requested account", async () => {
      const list = await repo.findByAccountId("acc-1");
      expect(list.map((t) => t.id).sort()).toEqual(["t1", "t2", "t3"]);
    });

    it("returns an empty array for an account with no transactions", async () => {
      expect(await repo.findByAccountId("ghost-account")).toEqual([]);
    });

    it("filters transactions by an inclusive 'from' date bound", async () => {
      const list = await repo.findByAccountId("acc-1", {
        from: new Date("2026-02-01T00:00:00Z"),
      });
      expect(list.map((t) => t.id).sort()).toEqual(["t2", "t3"]);
    });

    it("filters transactions by an inclusive 'to' date bound", async () => {
      const list = await repo.findByAccountId("acc-1", {
        to: new Date("2026-02-15T00:00:00Z"),
      });
      expect(list.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
    });

    it("filters transactions by both 'from' and 'to' (inclusive window)", async () => {
      const list = await repo.findByAccountId("acc-1", {
        from: new Date("2026-02-01T00:00:00Z"),
        to: new Date("2026-02-28T00:00:00Z"),
      });
      expect(list.map((t) => t.id)).toEqual(["t2"]);
    });

    it("returns an empty array when the date window excludes everything", async () => {
      const list = await repo.findByAccountId("acc-1", {
        from: new Date("2030-01-01T00:00:00Z"),
        to: new Date("2030-12-31T00:00:00Z"),
      });
      expect(list).toEqual([]);
    });
  });

  describe("findByIdempotencyKey", () => {
    it("returns the existing transaction when the key has been used", async () => {
      const tx = makeTx({ id: "tx-x", idempotencyKey: "key-x" });
      await repo.append(tx);

      const found = await repo.findByIdempotencyKey(IdempotencyKey("key-x"));
      expect(found?.id).toBe("tx-x");
      expect(found?.idempotencyKey).toBe("key-x");
    });

    it("returns null when the key is unknown", async () => {
      const found = await repo.findByIdempotencyKey(IdempotencyKey("never-used"));
      expect(found).toBeNull();
    });
  });
});

describe("ITransactionRepository — append-only contract", () => {
  it("the interface declares no mutation or delete methods", () => {
    const file = path.resolve(__dirname, "..", "..", "domain", "transaction-repository.ts");
    const src = fs.readFileSync(file, "utf-8");

    // Strip block comments so JSDoc words like 'update' don't trigger.
    const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    // Pull the interface body for ITransactionRepository and inspect method names.
    const ifaceMatch = withoutComments.match(
      /interface\s+ITransactionRepository\s*\{([\s\S]*?)\}/,
    );
    expect(ifaceMatch).not.toBeNull();
    const body = ifaceMatch![1] ?? "";

    const methodNames = Array.from(body.matchAll(/(\w+)\s*\(/g)).map((m) => m[1]);
    expect(methodNames.sort()).toEqual(["append", "findByAccountId", "findByIdempotencyKey"]);

    const banned = ["update", "delete", "remove", "replace", "save", "set", "modify"];
    for (const name of methodNames) {
      for (const bad of banned) {
        expect(name!.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("InMemoryTransactionRepository structurally implements ITransactionRepository", () => {
    const repo: ITransactionRepository = new InMemoryTransactionRepository();
    expect(typeof repo.append).toBe("function");
    expect(typeof repo.findByAccountId).toBe("function");
    expect(typeof repo.findByIdempotencyKey).toBe("function");
    // Sanity: no update/delete leak from the implementation.
    expect((repo as unknown as { update?: unknown }).update).toBeUndefined();
    expect((repo as unknown as { delete?: unknown }).delete).toBeUndefined();
    expect((repo as unknown as { remove?: unknown }).remove).toBeUndefined();
  });

  it("the contract lives in domain/ and imports nothing from infrastructure", () => {
    const file = path.resolve(__dirname, "..", "..", "domain", "transaction-repository.ts");
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
