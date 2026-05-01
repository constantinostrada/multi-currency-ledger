import { InMemoryAccountRepository } from "../../infrastructure/in-memory-account-repository";
import { Account } from "../../domain/account";
import { Currency, Money, OwnerId } from "../../domain/types";
import { AccountNotFoundError } from "../../domain/errors";
import { IAccountRepository } from "../../domain/account-repository";
import * as fs from "fs";
import * as path from "path";

function makeAccount(opts: { id: string; ownerId?: string; currency?: string; balance?: string }): Account {
  const currency = Currency.of(opts.currency ?? "USD");
  return new Account({
    id: opts.id,
    ownerId: OwnerId(opts.ownerId ?? "owner-1"),
    currency,
    balance: Money.of(opts.balance ?? "50.00", currency),
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("InMemoryAccountRepository", () => {
  let repo: IAccountRepository;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
  });

  describe("create", () => {
    it("persists a new account so findById can return it", async () => {
      const acc = makeAccount({ id: "acc-1" });
      await repo.create(acc);
      const found = await repo.findById("acc-1");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("acc-1");
      expect(found?.balance.toDecimalString()).toBe("50.00");
    });

    it("throws when creating an account whose id already exists", async () => {
      await repo.create(makeAccount({ id: "dup" }));
      await expect(repo.create(makeAccount({ id: "dup" }))).rejects.toThrow(/already exists/i);
    });
  });

  describe("findById", () => {
    it("returns null for an unknown id", async () => {
      expect(await repo.findById("missing")).toBeNull();
    });

    it("returns a fresh, frozen Account each call so the store cannot be mutated through references", async () => {
      const acc = makeAccount({ id: "frozen", balance: "10.00" });
      await repo.create(acc);

      const a = await repo.findById("frozen");
      const b = await repo.findById("frozen");
      expect(a).not.toBe(b);
      expect(Object.isFrozen(a)).toBe(true);
      expect(a?.balance.toDecimalString()).toBe("10.00");
    });
  });

  describe("findByOwnerId", () => {
    it("returns all accounts for an owner and an empty array for an unknown owner", async () => {
      await repo.create(makeAccount({ id: "a1", ownerId: "owner-A" }));
      await repo.create(makeAccount({ id: "a2", ownerId: "owner-A" }));
      await repo.create(makeAccount({ id: "a3", ownerId: "owner-B" }));

      const aAccounts = await repo.findByOwnerId(OwnerId("owner-A"));
      expect(aAccounts.map((x) => x.id).sort()).toEqual(["a1", "a2"]);

      const bAccounts = await repo.findByOwnerId(OwnerId("owner-B"));
      expect(bAccounts).toHaveLength(1);

      const missing = await repo.findByOwnerId(OwnerId("owner-C"));
      expect(missing).toEqual([]);
    });
  });

  describe("updateBalance", () => {
    it("replaces the stored balance and is observable on the next read", async () => {
      const usd = Currency.of("USD");
      await repo.create(makeAccount({ id: "acc-u", balance: "20.00" }));

      await repo.updateBalance("acc-u", Money.of("75.50", usd));
      const found = await repo.findById("acc-u");
      expect(found?.balance.toDecimalString()).toBe("75.50");
    });

    it("throws AccountNotFoundError when the id is unknown", async () => {
      const usd = Currency.of("USD");
      await expect(repo.updateBalance("ghost", Money.of("1.00", usd))).rejects.toBeInstanceOf(
        AccountNotFoundError,
      );
    });

    it("rejects an update whose currency differs from the account's currency", async () => {
      const eur = Currency.of("EUR");
      await repo.create(makeAccount({ id: "acc-cur", currency: "USD" }));
      await expect(repo.updateBalance("acc-cur", Money.of("1.00", eur))).rejects.toThrow(/currency/i);
    });

    it("is the only repository channel that mutates balance — mutating a returned Account does not leak back", async () => {
      const usd = Currency.of("USD");
      await repo.create(makeAccount({ id: "iso", balance: "1.00" }));

      const fetched = await repo.findById("iso");
      // The entity is frozen, but even if a caller swapped fields on a non-frozen wrapper,
      // the store keeps its own snapshot.
      expect(() => {
        // @ts-expect-error verifying runtime immutability
        fetched!.balance = Money.of("9999.00", usd);
      }).toThrow(TypeError);

      const refetched = await repo.findById("iso");
      expect(refetched?.balance.toDecimalString()).toBe("1.00");
    });
  });
});

describe("InMemoryAccountRepository — layering", () => {
  it("the IAccountRepository contract lives in domain/ and imports nothing from infrastructure", () => {
    const file = path.resolve(__dirname, "..", "..", "domain", "account-repository.ts");
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

  it("InMemoryAccountRepository structurally implements IAccountRepository", () => {
    const repo: IAccountRepository = new InMemoryAccountRepository();
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.findByOwnerId).toBe("function");
    expect(typeof repo.updateBalance).toBe("function");
  });
});
