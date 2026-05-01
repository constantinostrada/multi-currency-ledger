import { InitiateTransferUseCase } from "../../../application/use-cases/InitiateTransferUseCase";
import { CreateAccountUseCase } from "../../../application/use-cases/CreateAccountUseCase";
import { InMemoryAccountRepository } from "../../../infrastructure/repositories/InMemoryAccountRepository";
import { InMemoryLedgerEntryRepository } from "../../../infrastructure/repositories/InMemoryLedgerEntryRepository";
import { InMemoryTransferRepository } from "../../../infrastructure/repositories/InMemoryTransferRepository";
import { StaticExchangeRateService } from "../../../infrastructure/exchange-rate/StaticExchangeRateService";
import type { IIdGenerator } from "../../../application/ports/IIdGenerator";

class SequentialIdGenerator implements IIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}

async function setup() {
  const accountRepo = new InMemoryAccountRepository();
  const transferRepo = new InMemoryTransferRepository();
  const ledgerRepo = new InMemoryLedgerEntryRepository();
  const exchangeRateService = new StaticExchangeRateService();
  const idGen = new SequentialIdGenerator();

  const createAccount = new CreateAccountUseCase(accountRepo, idGen);
  const initiateTransfer = new InitiateTransferUseCase(
    accountRepo,
    transferRepo,
    ledgerRepo,
    idGen,
    exchangeRateService,
  );

  return { accountRepo, transferRepo, ledgerRepo, createAccount, initiateTransfer };
}

describe("InitiateTransferUseCase", () => {
  it("transfers between two same-currency accounts", async () => {
    const { createAccount, initiateTransfer } = await setup();

    const src = await createAccount.execute({
      ownerId: "user-1",
      name: "Source USD",
      currencyCode: "USD",
      initialBalance: "1000.00",
    });
    const dst = await createAccount.execute({
      ownerId: "user-2",
      name: "Dest USD",
      currencyCode: "USD",
      initialBalance: "0.00",
    });

    const result = await initiateTransfer.execute({
      sourceAccountId: src.id,
      destinationAccountId: dst.id,
      amount: "250.00",
      description: "Test transfer",
    });

    expect(result.transfer.status).toBe("COMPLETED");
    expect(result.transfer.exchangeRate).toBe(1);
    expect(result.transfer.isCrossCurrency).toBe(false);
    expect(result.debitEntry.type).toBe("DEBIT");
    expect(result.creditEntry.type).toBe("CREDIT");
  });

  it("transfers between two different-currency accounts", async () => {
    const { createAccount, initiateTransfer } = await setup();

    const src = await createAccount.execute({
      ownerId: "user-1",
      name: "USD account",
      currencyCode: "USD",
      initialBalance: "1000.00",
    });
    const dst = await createAccount.execute({
      ownerId: "user-2",
      name: "EUR account",
      currencyCode: "EUR",
      initialBalance: "0.00",
    });

    const result = await initiateTransfer.execute({
      sourceAccountId: src.id,
      destinationAccountId: dst.id,
      amount: "100.00",
      description: "FX transfer",
    });

    expect(result.transfer.isCrossCurrency).toBe(true);
    expect(result.transfer.sourceCurrencyCode).toBe("USD");
    expect(result.transfer.destinationCurrencyCode).toBe("EUR");
    // Exchange rate should be a positive number
    expect(result.transfer.exchangeRate).toBeGreaterThan(0);
  });

  it("throws AccountNotFoundException for unknown source account", async () => {
    const { initiateTransfer } = await setup();
    await expect(
      initiateTransfer.execute({
        sourceAccountId: "nonexistent",
        destinationAccountId: "also-nonexistent",
        amount: "10.00",
        description: "fail",
      }),
    ).rejects.toThrow("Account not found");
  });

  it("throws when source has insufficient funds", async () => {
    const { createAccount, initiateTransfer } = await setup();

    const src = await createAccount.execute({
      ownerId: "u1",
      name: "Poor account",
      currencyCode: "USD",
      initialBalance: "10.00",
    });
    const dst = await createAccount.execute({
      ownerId: "u2",
      name: "Rich account",
      currencyCode: "USD",
      initialBalance: "0.00",
    });

    await expect(
      initiateTransfer.execute({
        sourceAccountId: src.id,
        destinationAccountId: dst.id,
        amount: "500.00",
        description: "too much",
      }),
    ).rejects.toThrow("Insufficient funds");
  });
});
