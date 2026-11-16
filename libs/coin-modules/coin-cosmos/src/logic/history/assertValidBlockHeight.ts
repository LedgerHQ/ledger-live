import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export function assertValidBlockHeight(height: number): void {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new InvalidParameterError(`Invalid block height: ${height}`);
  }
}
