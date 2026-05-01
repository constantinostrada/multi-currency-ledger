/**
 * GET /api/accounts/:accountId/ledger — paginated ledger entries for an account
 *
 * Query params:
 *   fromDate   ISO 8601 string (optional)
 *   toDate     ISO 8601 string (optional)
 *   limit      integer (optional, default 50)
 *   offset     integer (optional, default 0)
 */

import { NextRequest } from "next/server";
import { ok, badRequest, handleError } from "@/interfaces/http/helpers/apiResponse";
import { listLedgerEntriesUseCase } from "@/infrastructure/container";

interface RouteContext {
  params: { accountId: string };
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { accountId } = context.params;

  if (!accountId) {
    return badRequest("accountId route parameter is required.");
  }

  const params = request.nextUrl.searchParams;
  const limitRaw = params.get("limit");
  const offsetRaw = params.get("offset");

  const limit = limitRaw !== null ? parseInt(limitRaw, 10) : undefined;
  const offset = offsetRaw !== null ? parseInt(offsetRaw, 10) : undefined;

  if (limit !== undefined && (isNaN(limit) || limit < 1)) {
    return badRequest("limit must be a positive integer.");
  }
  if (offset !== undefined && (isNaN(offset) || offset < 0)) {
    return badRequest("offset must be a non-negative integer.");
  }

  try {
    const result = await listLedgerEntriesUseCase.execute({
      accountId,
      fromDate: params.get("fromDate") ?? undefined,
      toDate: params.get("toDate") ?? undefined,
      limit,
      offset,
    });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
