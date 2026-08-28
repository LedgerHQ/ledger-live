import type { CardSessionRenewalError, StoredCardSession } from "../types";

/**
 * The only two answers that end a session.
 *
 * Baanx rotates the refresh token on every use, so a lost response leaves a token the client cannot
 * judge: it may be intact, or it may already be spent. A transport failure therefore keeps the
 * session, and the next attempt decides. A spent token answers 400 or 401, which lands here.
 */
const TERMINAL_STATUSES = new Set([400, 401]);

export function isTerminalRenewalFailure(error: unknown): boolean {
  const status = readHttpStatus(error);
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

/** Keeps a status and a message. Never `data`, which can echo a token. */
export function sanitizeRenewalError(error: unknown): CardSessionRenewalError {
  const status = readStatus(error);
  return status === undefined
    ? { message: describeError(error) }
    : { status, message: describeError(error) };
}

/**
 * A renewal that answered with something other than a session must not be persisted.
 *
 * Only the two tokens are checked. The endpoint's `responseSchema` has already validated the wire
 * body, and the lifetime it carries is not stored.
 */
export function isRenewedSession(value: unknown): value is StoredCardSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { accessToken, refreshToken } = value as Record<string, unknown>;
  return (
    typeof accessToken === "string" &&
    accessToken.length > 0 &&
    typeof refreshToken === "string" &&
    refreshToken.length > 0
  );
}

function readStatus(error: unknown): number | string | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const { status } = error as { status: unknown };
  return typeof status === "number" || typeof status === "string" ? status : undefined;
}

/** A body the provider did not send as JSON is still an HTTP status, and still decides. */
function readHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const { status, originalStatus } = error as { status: unknown; originalStatus?: unknown };
  if (typeof status === "number") {
    return status;
  }
  if (status === "PARSING_ERROR" && typeof originalStatus === "number") {
    return originalStatus;
  }
  return undefined;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    // `error` on a fetch failure, `message` on a serialized one. Both are already sanitized.
    if (typeof record.error === "string") {
      return record.error;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
    return "the card session renewal failed";
  }

  return String(error);
}
