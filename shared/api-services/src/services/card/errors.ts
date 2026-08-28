import { CARD_RENEWAL_UNAVAILABLE, CARD_SESSION_ENDED, UNAUTHORIZED_STATUS } from "./constants";

/** True for any Card HTTP 401, whoever produced it. */
export function isCardUnauthorized(error: unknown): boolean {
  return readStatus(error) === UNAUTHORIZED_STATUS;
}

/**
 * True for a 401 the session owner could not judge: the renewal failed for a nonterminal reason
 * (5xx, a timeout, a transport failure, a store it could not read), or the request outlived its
 * session.
 *
 * A caller must not end a login on one of these. The session may still be good, and the next 401
 * tries the renewal again.
 */
export function isCardRenewalUnavailable(error: unknown): boolean {
  return isCardUnauthorized(error) && readBodyMessage(error) === CARD_RENEWAL_UNAVAILABLE;
}

function readStatus(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  return (error as { status: unknown }).status;
}

function readBodyMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return undefined;
  }

  const { data } = error as { data: unknown };
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return undefined;
  }

  const { message } = data as { message: unknown };
  return typeof message === "string" ? message : undefined;
}
