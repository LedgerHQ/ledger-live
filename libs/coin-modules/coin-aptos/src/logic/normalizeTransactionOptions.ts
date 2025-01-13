import type { TransactionOptions } from "../types";

export function normalizeTransactionOptions(options: TransactionOptions): TransactionOptions {
  const check = (v: any) => ((v ?? "").toString().trim() ? v : undefined);
  return {
    maxGasAmount: check(options.maxGasAmount),
    gasUnitPrice: check(options.gasUnitPrice),
    sequenceNumber: check(options.sequenceNumber),
    expirationTimestampSecs: check(options.expirationTimestampSecs),
  };
}
