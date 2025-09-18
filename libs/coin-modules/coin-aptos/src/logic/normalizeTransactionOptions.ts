import type { TransactionOptions } from "../types";

export function normalizeTransactionOptions(options: TransactionOptions): TransactionOptions {
  // FIXME: this is wrong. TransactionOptions is
  // {
  //     maxGasAmount: string;
  //     gasUnitPrice: string;
  //     sequenceNumber?: string;
  //     expirationTimestampSecs?: string;
  // }
  // meaning we can't return undefined in check method.
  // This method is useless, not deleting as it breaks code and this iteration is coin modularisation.
  const check = (v: any) => ((v ?? "").toString().trim() ? v : undefined);
  return {
    maxGasAmount: check(options.maxGasAmount),
    gasUnitPrice: check(options.gasUnitPrice),
  };
}
