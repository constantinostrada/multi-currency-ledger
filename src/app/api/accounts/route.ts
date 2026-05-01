/**
 * POST /api/accounts   — create a new account
 * GET  /api/accounts   — list accounts by ownerId query param
 *
 * Controller responsibility: parse → validate shape → call use case → serialize.
 * Business rules live in domain. Orchestration lives in application.
 */

import { NextRequest } from "next/server";
import {
  created,
  ok,
  badRequest,
  handleError,
} from "@/interfaces/http/helpers/apiResponse";
import {
  createAccountUseCase,
  listAccountsUseCase,
} from "@/infrastructure/container";
import type { CreateAccountDTO } from "@/application/dtos/AccountDTO";

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const dto = body as Partial<CreateAccountDTO>;

  if (!dto.ownerId || typeof dto.ownerId !== "string") {
    return badRequest("ownerId is required and must be a string.");
  }
  if (!dto.name || typeof dto.name !== "string") {
    return badRequest("name is required and must be a string.");
  }
  if (!dto.currencyCode || typeof dto.currencyCode !== "string") {
    return badRequest("currencyCode is required and must be a string.");
  }

  try {
    const result = await createAccountUseCase.execute({
      ownerId: dto.ownerId,
      name: dto.name,
      currencyCode: dto.currencyCode,
      initialBalance: typeof dto.initialBalance === "string" ? dto.initialBalance : undefined,
      allowOverdraft: typeof dto.allowOverdraft === "boolean" ? dto.allowOverdraft : false,
    });
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const ownerId = request.nextUrl.searchParams.get("ownerId");

  if (!ownerId) {
    return badRequest("Query parameter 'ownerId' is required.");
  }

  try {
    const result = await listAccountsUseCase.execute({ ownerId });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
