/**
 * GetTransferUseCase — Application Layer
 *
 * Fetches a single transfer by ID.
 */

import { TransferNotFoundException } from "@/domain/exceptions/DomainException";
import { ITransferRepository } from "@/domain/repositories/ITransferRepository";
import type { GetTransferDTO, TransferResponseDTO } from "../dtos/TransferDTO";
import { TransferMapper } from "../mappers/TransferMapper";

export class GetTransferUseCase {
  constructor(private readonly transferRepository: ITransferRepository) {}

  async execute(dto: GetTransferDTO): Promise<TransferResponseDTO> {
    const transfer = await this.transferRepository.findById(dto.transferId);

    if (!transfer) throw new TransferNotFoundException(dto.transferId);

    return TransferMapper.toTransferResponseDTO(transfer);
  }
}
