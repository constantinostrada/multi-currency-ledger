/**
 * IAccountRepository — Repository contract for the Account aggregate.
 *
 * Defines persistence operations the application layer relies on. Lives in
 * the domain so it has no awareness of any storage technology.
 */

import { Account } from "./account";
import { Money, OwnerId } from "./types";

export interface IAccountRepository {
  create(account: Account): Promise<void>;

  findById(id: string): Promise<Account | null>;

  findByOwnerId(ownerId: OwnerId): Promise<Account[]>;

  /**
   * Replace an account's balance. The only sanctioned channel for mutating
   * balance state — entities returned from `findById` / `findByOwnerId` are
   * frozen snapshots and cannot be mutated in place.
   */
  updateBalance(id: string, newBalance: Money): Promise<void>;
}
