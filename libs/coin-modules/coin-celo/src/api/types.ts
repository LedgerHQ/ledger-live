/** Discriminates the two Celo transaction encodings the api can produce. */
export type CeloTxType = "eip1559" | "cip64";

/**
 * The Celo-specific contents of `FeeEstimation.parameters`.
 *
 * `estimateFees` produces this object; `craftTransaction` reads it back to
 * assemble the exact transaction that was priced (the craft↔estimate handshake,
 * since the framework `TransactionIntent` carries no fee-currency field).
 *
 * NOTE: when `feeCurrency` is set, the accompanying `FeeEstimation.value` is
 * denominated in that fee token's base units — Celo prices gas in the fee
 * currency — NOT in native CELO. Callers must not sum it with CELO amounts.
 */
export type CeloFeeParameters = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  feeCurrency?: `0x${string}`;
  type: CeloTxType;
};
