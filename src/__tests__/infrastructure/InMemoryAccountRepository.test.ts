import { InMemoryAccountRepository } from "../../infrastructure/repositories/InMemoryAccountRepository";
import { Account } from "../../domain/entities/Account";
import { Currency } from "../../domain/value-objects/Currency";

function makeAccount(id: string, ownerId: string = "owner-1"): Account {
  const now = new Date();
  return new Account({
    id,
    ownerId,
    name: `Account ${id}`,
    currency: Currency.of("USD"),
    balanceMinorUnits: 5000n,
    allowOverdraft: false,
    createdAt: now,
    updatedAt: now,
  });
}

describe("InMemoryAccountRepository", () => {
  let repo: InMemoryAccountRepository;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
  });

  it("saves and retrieves an account by id", async () => {
    const acc = makeAccount("acc-1");
    await repo.save(acc);
    const found = await repo.findById("acc-1");
    expect(found).not.toBeNull();
    expect(found?.id).toBe("acc-1");
  });

  it("returns null for unknown id", async () => {
    const found = await repo.findById("unknown");
    expect(found).toBeNull();
  });

  it("throws when saving duplicate id", async () => {
    const acc = makeAccount("acc-dup");
    await repo.save(acc);
    await expect(repo.save(acc)).rejects.toThrow("already exists");
  });

  it("updates an account", async () => {
    const acc = makeAccount("acc-upd");
    await repo.save(acc);
    acc.rename("Updated Name");
    await repo.update(acc);
    const found = await repo.findById("acc-upd");
    expect(found?.name).toBe("Updated Name");
  });

  it("throws when updating non-existent account", async () => {
    const acc = makeAccount("ghost");
    await expect(repo.update(acc)).rejects.toThrow("not found");
  });

  it("lists accounts by ownerId", async () => {
    await repo.save(makeAccount("a1", "owner-A"));
    await repo.save(makeAccount("a2", "owner-A"));
    await repo.save(makeAccount("a3", "owner-B"));

    const ownerA = await repo.findByOwnerId("owner-A");
    expect(ownerA).toHaveLength(2);

    const ownerB = await repo.findByOwnerId("owner-B");
    expect(ownerB).toHaveLength(1);
  });

  it("deletes an account", async () => {
    await repo.save(makeAccount("del-me"));
    await repo.delete("del-me");
    expect(await repo.findById("del-me")).toBeNull();
  });
});
