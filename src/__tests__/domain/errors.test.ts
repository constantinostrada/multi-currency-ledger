import {
  DomainError,
  InsufficientFundsError,
  NoExchangeRateError,
  DuplicateIdempotencyKeyError,
  AccountNotFoundError,
} from "../../domain/errors";

describe("Domain errors", () => {
  describe("InsufficientFundsError", () => {
    it("is an instance of InsufficientFundsError, DomainError, and Error", () => {
      const err = new InsufficientFundsError("acc-1");
      expect(err).toBeInstanceOf(InsufficientFundsError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("carries the expected name and accountId", () => {
      const err = new InsufficientFundsError("acc-1");
      expect(err.name).toBe("InsufficientFundsError");
      expect(err.accountId).toBe("acc-1");
      expect(err.message).toContain("acc-1");
    });
  });

  describe("NoExchangeRateError", () => {
    it("is an instance of NoExchangeRateError, DomainError, and Error", () => {
      const err = new NoExchangeRateError("USD", "EUR");
      expect(err).toBeInstanceOf(NoExchangeRateError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("exposes from/to currencies and a default message", () => {
      const err = new NoExchangeRateError("USD", "EUR");
      expect(err.name).toBe("NoExchangeRateError");
      expect(err.fromCurrency).toBe("USD");
      expect(err.toCurrency).toBe("EUR");
      expect(err.message).toContain("USD");
      expect(err.message).toContain("EUR");
    });
  });

  describe("DuplicateIdempotencyKeyError", () => {
    it("is an instance of DuplicateIdempotencyKeyError, DomainError, and Error", () => {
      const err = new DuplicateIdempotencyKeyError("key-123");
      expect(err).toBeInstanceOf(DuplicateIdempotencyKeyError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("carries the offending key", () => {
      const err = new DuplicateIdempotencyKeyError("key-123");
      expect(err.name).toBe("DuplicateIdempotencyKeyError");
      expect(err.idempotencyKey).toBe("key-123");
    });
  });

  describe("AccountNotFoundError", () => {
    it("is an instance of AccountNotFoundError, DomainError, and Error", () => {
      const err = new AccountNotFoundError("missing");
      expect(err).toBeInstanceOf(AccountNotFoundError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
    });

    it("carries the missing accountId", () => {
      const err = new AccountNotFoundError("missing");
      expect(err.name).toBe("AccountNotFoundError");
      expect(err.accountId).toBe("missing");
    });
  });

  describe("class disambiguation", () => {
    it("distinct error classes are not interchangeable as instanceof", () => {
      const insufficient = new InsufficientFundsError("acc-1");
      expect(insufficient).not.toBeInstanceOf(AccountNotFoundError);
      expect(insufficient).not.toBeInstanceOf(NoExchangeRateError);
      expect(insufficient).not.toBeInstanceOf(DuplicateIdempotencyKeyError);
    });
  });

  describe("custom messages", () => {
    it("InsufficientFundsError accepts an override message", () => {
      const err = new InsufficientFundsError("acc-1", "custom");
      expect(err.message).toBe("custom");
    });
  });
});
