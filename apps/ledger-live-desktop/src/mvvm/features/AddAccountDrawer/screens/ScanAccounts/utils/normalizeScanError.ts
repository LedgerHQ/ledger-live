import { LedgerAPI5xx, NetworkDown } from "@ledgerhq/live-common/errors";

const NETWORK_CODES = new Set(["NETWORK_ERROR", "TIMEOUT"]);
const SERVER_RESPONSE_REGEX = /server response (5\d\d)/i;

/**
 * Replaces raw provider/HTTP errors (e.g. ethers `SERVER_ERROR` embedding an HTML body)
 * with Ledger errors that have concise translations. Other errors pass through untouched.
 */
export function normalizeScanError(error: unknown): Error {
  if (!(error instanceof Error)) return new Error(String(error));

  const code = (error as { code?: unknown }).code;
  const message = error.message ?? "";
  const status = SERVER_RESPONSE_REGEX.exec(message)?.[1];

  if (code === "SERVER_ERROR" || status || message.includes("<!DOCTYPE")) {
    return new LedgerAPI5xx(status ? `HTTP ${status}` : "HTTP 5xx");
  }
  if (typeof code === "string" && NETWORK_CODES.has(code)) {
    return new NetworkDown();
  }
  return error;
}
