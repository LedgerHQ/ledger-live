import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export function assertValidPaginationLimit(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new InvalidParameterError(`Invalid pagination limit: ${limit}`);
  }
}
