import { UNAUTHORIZED_STATUS } from "./constants";

/**
 * A Card request that never became a body: the provider answered a failure status, or it answered
 * something the transport could not read as JSON.
 *
 * The message names the path and the status, and never the body. The two OAuth2 grants use this
 * transport, and their bodies are credentials.
 */
export class CardRequestError extends Error {
  override name = "CardRequestError";
  constructor(path: string, reason: string) {
    super(`the Card request to ${path} failed: ${reason}`);
  }
}

/** True for any Card HTTP 401, whoever produced it. */
export function isCardUnauthorized(error: unknown): boolean {
  return readStatus(error) === UNAUTHORIZED_STATUS;
}

function readStatus(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  return (error as { status: unknown }).status;
}
