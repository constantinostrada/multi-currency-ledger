/**
 * IAccountRepository — Repository Interface (Domain)
 *
 * Describes WHAT persistence operations are needed for Account entities.
 * The HOW is implemented in the infrastructure layer.
 */

import { Account } from "../entities/Account";

export interface IAccountRepository {
  /** Find an account by its unique ID. Returns null if not found. */
  findById(id: string): Promise<Account | null>;

  /** Find all accounts belonging to a given owner. */
  findByOwnerId(ownerId: string): Promise<Account[]>;

  /** Persist a new account. Throws if an account with the same ID already exists. */
  save(account: Account): Promise<void>;

  /** Persist changes to an existing account. */
  update(account: Account): Promise<void>;

  /** Remove an account by ID. No-op if not found. */
  delete(id: string): Promise<void>;
}
