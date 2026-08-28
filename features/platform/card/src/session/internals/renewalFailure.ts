import { UNAUTHORIZED_STATUS } from "@shared/api-services";
import type { CardSessionRenewalError } from "../types";

const BAD_REQUEST_STATUS = 400;

/**
 * The OAuth2 error codes that end a session (RFC 6749, section 5.2).
 *
 * The token endpoint answers a rejected grant with 400 and a JSON body that names the reason. Only
 * these reasons say that the refresh token itself is finished.
 */
const TERMINAL_GRANT_ERRORS = new Set(["invalid_grant", "invalid_client", "unauthorized_client"]);

/**
 * True when the answer means the refresh token is finished and the session must be cleaned up.
 *
 * Baanx rotates the refresh token on every use, so a lost response leaves a token the client cannot
 * judge: it may be intact, or the provider may have used it already. A transport failure keeps the
 * session, and the next attempt decides.
 *
 * A 400 alone is not enough. A proxy, a captive portal or a firewall answers the same status with
 * an HTML page, and a client-side mistake in the request body answers it too. Reading the OAuth2
 * error code keeps those out: no code, no logout.
 */
export function isTerminalRenewalFailure(error: unknown): boolean {
  const status = readHttpStatus(error);

  if (status === UNAUTHORIZED_STATUS) {
    return true;
  }

  if (status !== BAD_REQUEST_STATUS) {
    return false;
  }

  const code = readGrantErrorCode(error);
  return code !== undefined && TERMINAL_GRANT_ERRORS.has(code);
}

/** Keeps a status and a message. Never `data`, which can echo a token. */
export function sanitizeRenewalError(error: unknown): CardSessionRenewalError {
  const status = readStatus(error);
  return status === undefined
    ? { message: describeError(error) }
    : { status, message: describeError(error) };
}

function readStatus(error: unknown): number | string | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const { status } = error as { status: unknown };
  return typeof status === "number" || typeof status === "string" ? status : undefined;
}

/**
 * Only a real HTTP status decides. `PARSING_ERROR` carries the status of a body the client could not
 * read, which is the error-page case above, so it never ends a session.
 */
function readHttpStatus(error: unknown): number | undefined {
  const status = readStatus(error);
  return typeof status === "number" ? status : undefined;
}

/** The `error` member of an OAuth2 error body. A short code, never the token that was rejected. */
function readGrantErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }

  const { data } = error as { data: unknown };
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return undefined;
  }

  const code = (data as { error: unknown }).error;
  return typeof code === "string" ? code : undefined;
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
