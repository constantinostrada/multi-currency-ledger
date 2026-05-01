/**
 * GET /api/accounts/:accountId — get a single account by ID
 */

import { NextRequest } from "next/server";
import { ok, badRequest, handleError } from "@/interfaces/http/helpers/apiResponse";
import { getAccountUseCase } from "@/infrastructure/container";

interface RouteContext {
  params: { accountId: string };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { accountId } = context.params;

  if (!accountId) {
    return badRequest("accountId route parameter is required.");
  }

  try {
    const result = await getAccountUseCase.execute({ accountId });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
