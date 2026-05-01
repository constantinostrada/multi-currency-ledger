/**
 * ITransferRepository — Repository Interface (Domain)
 *
 * Persistence contract for Transfer entities.
 */

import { Transfer } from "../entities/Transfer";

export interface ITransferRepository {
  findById(id: string): Promise<Transfer | null>;
  findByAccountId(accountId: string): Promise<Transfer[]>;
  save(transfer: Transfer): Promise<void>;
  update(transfer: Transfer): Promise<void>;
}
