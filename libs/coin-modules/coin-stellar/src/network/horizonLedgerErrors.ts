import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import { NetworkError, NotFoundError } from "@stellar/stellar-sdk";

export function messageFromHorizonUnknown(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === "string") {
    return e;
  }
  return "";
}

const HORIZON_STATUS_404 = /status code 404/;
const HORIZON_TOO_MANY_REQUESTS = /too many requests/i;
const HORIZON_STATUS_4XX = /status code 4\d{2}/;
const HORIZON_STATUS_5XX = /status code 5\d{2}/;
const HORIZON_NETWORK_DOWN = /ECONNRESET|ECONNREFUSED|ENOTFOUND|EPIPE|ETIMEDOUT/;
const HORIZON_UNDEFINED_OBJECT = /undefined is not an object/;

export function throwHorizonLedgerOrOperationsError(e: unknown, notFoundMessage: string): never {
  const errorMsg = messageFromHorizonUnknown(e);

  if (e instanceof NotFoundError || HORIZON_STATUS_404.exec(errorMsg)) {
    throw new Error(notFoundMessage);
  }
  if (HORIZON_TOO_MANY_REQUESTS.exec(errorMsg)) {
    throw new LedgerAPI4xx("status code 4xx", { status: 429, url: undefined, method: "GET" });
  }
  if (HORIZON_STATUS_4XX.exec(errorMsg)) {
    throw new LedgerAPI4xx();
  }
  if (HORIZON_STATUS_5XX.exec(errorMsg)) {
    throw new LedgerAPI5xx();
  }
  if (
    e instanceof NetworkError ||
    HORIZON_NETWORK_DOWN.exec(errorMsg) ||
    HORIZON_UNDEFINED_OBJECT.exec(errorMsg)
  ) {
    throw new NetworkDown();
  }

  throw e;
}
