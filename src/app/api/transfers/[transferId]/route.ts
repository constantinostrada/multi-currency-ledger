/**
 * GET /api/transfers/:transferId — get a single transfer by ID
 */

import { NextRequest } from "next/server";
import { ok, badRequest, handleError } from "@/interfaces/http/helpers/apiResponse";
import { getTransferUseCase } from "@/infrastructure/container";

interface RouteContext {
  params: { transferId: string };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { transferId } = context.params;

  if (!transferId) {
    return badRequest("transferId route parameter is required.");
  }

  try {
    const result = await getTransferUseCase.execute({ transferId });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
