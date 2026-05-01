import { CreateAccountUseCase } from "../../../application/use-cases/CreateAccountUseCase";
import { InMemoryAccountRepository } from "../../../infrastructure/repositories/InMemoryAccountRepository";
import type { IIdGenerator } from "../../../application/ports/IIdGenerator";

class FixedIdGenerator implements IIdGenerator {
  private counter = 0;
  generate(): string {
    return `generated-id-${++this.counter}`;
  }
}

describe("CreateAccountUseCase", () => {
  let repo: InMemoryAccountRepository;
  let idGen: FixedIdGenerator;
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    idGen = new FixedIdGenerator();
    useCase = new CreateAccountUseCase(repo, idGen);
  });

  it("creates an account and returns a DTO", async () => {
    const result = await useCase.execute({
      ownerId: "owner-1",
      name: "My USD Account",
      currencyCode: "USD",
      initialBalance: "500.00",
    });

    expect(result.id).toBe("generated-id-1");
    expect(result.ownerId).toBe("owner-1");
    expect(result.name).toBe("My USD Account");
    expect(result.currencyCode).toBe("USD");
    expect(result.balance).toBe("500.00");
    expect(result.allowOverdraft).toBe(false);
  });

  it("defaults initial balance to 0.00", async () => {
    const result = await useCase.execute({
      ownerId: "owner-1",
      name: "Zero Balance",
      currencyCode: "EUR",
    });
    expect(result.balance).toBe("0.00");
  });

  it("throws for unsupported currency codes", async () => {
    await expect(
      useCase.execute({ ownerId: "owner-1", name: "Bad", currencyCode: "ZZZ" }),
    ).rejects.toThrow("Unsupported currency code");
  });

  it("persists the account so it can be found later", async () => {
    const created = await useCase.execute({
      ownerId: "owner-2",
      name: "Savings",
      currencyCode: "GBP",
    });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Savings");
  });
});
