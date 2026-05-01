/**
 * POST /api/transfers — initiate a funds transfer between two accounts
 */

import { NextRequest } from "next/server";
import { created, badRequest, handleError } from "@/interfaces/http/helpers/apiResponse";
import { initiateTransferUseCase } from "@/infrastructure/container";
import type { InitiateTransferDTO } from "@/application/dtos/TransferDTO";

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const dto = body as Partial<InitiateTransferDTO>;

  if (!dto.sourceAccountId || typeof dto.sourceAccountId !== "string") {
    return badRequest("sourceAccountId is required and must be a string.");
  }
  if (!dto.destinationAccountId || typeof dto.destinationAccountId !== "string") {
    return badRequest("destinationAccountId is required and must be a string.");
  }
  if (!dto.amount || typeof dto.amount !== "string") {
    return badRequest("amount is required and must be a decimal string (e.g. '100.00').");
  }
  if (!dto.description || typeof dto.description !== "string") {
    return badRequest("description is required and must be a string.");
  }

  try {
    const result = await initiateTransferUseCase.execute({
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      amount: dto.amount,
      description: dto.description,
    });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
