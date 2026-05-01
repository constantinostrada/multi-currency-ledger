/**
 * apiResponse — Interfaces Layer
 *
 * Thin helpers for building consistent JSON responses in Next.js Route Handlers.
 * Status codes are decided here; business rules remain in domain/application.
 */

import { NextResponse } from "next/server";
import { DomainException } from "@/application/../domain/exceptions/DomainException";

// Note: We import DomainException only to inspect its name for status mapping.
// The import goes domain → interfaces (exception class only, no entity manipulation).

export interface ApiErrorBody {
  error: string;
  code: string;
}

export function ok<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 200 });
}

export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code: "BAD_REQUEST" }, { status: 400 });
}

export function notFound(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code: "NOT_FOUND" }, { status: 404 });
}

export function unprocessable(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code: "UNPROCESSABLE_ENTITY" }, { status: 422 });
}

export function internalError(message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}

/**
 * Maps a caught error to the appropriate HTTP response.
 * Keeps error-handling logic out of individual route files.
 */
export function handleError(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof DomainException) {
    switch (err.name) {
      case "AccountNotFoundException":
      case "TransferNotFoundException":
        return notFound(err.message);
      case "InsufficientFundsException":
      case "CurrencyMismatchException":
        return unprocessable(err.message);
      default:
        return unprocessable(err.message);
    }
  }
  if (err instanceof Error) {
    // Surface validation-style errors from value objects as 422
    if (
      err.message.includes("Unsupported currency") ||
      err.message.includes("must not be empty") ||
      err.message.includes("must be positive") ||
      err.message.includes("must be non-negative") ||
      err.message.includes("Invalid transaction type")
    ) {
      return unprocessable(err.message);
    }
    return internalError(err.message);
  }
  return internalError("An unexpected error occurred.");
}
