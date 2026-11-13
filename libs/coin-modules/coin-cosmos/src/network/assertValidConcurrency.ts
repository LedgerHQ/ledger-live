import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export function isValidConcurrency(concurrency: unknown): concurrency is number {
  return typeof concurrency === "number" && Number.isSafeInteger(concurrency) && concurrency > 0;
}

export function assertValidConcurrency(concurrency: number): void {
  if (!isValidConcurrency(concurrency)) {
    throw new InvalidParameterError(`Invalid concurrency: ${concurrency}`);
  }
}
