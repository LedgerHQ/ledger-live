import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export function isValidPaginationLimit(limit: unknown): limit is number {
  return typeof limit === "number" && Number.isSafeInteger(limit) && limit > 0;
}

export function assertValidPaginationLimit(limit: number): void {
  if (!isValidPaginationLimit(limit)) {
    throw new InvalidParameterError(`Invalid pagination limit: ${limit}`);
  }
}
