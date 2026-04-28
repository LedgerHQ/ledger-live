/**
 * Celo transaction request — fields used internally by coin-celo
 * for building, signing, and broadcasting transactions.
 *
 * Mirrors the relevant subset of what `@celo/connect`'s `CeloTx` offered,
 * now expressed in plain types without any `@celo/*` dependency.
 */
export type CeloTransactionRequest = {
  from: `0x${string}`;
  to?: `0x${string}`;
  data?: `0x${string}`;
  /** Hex-encoded value (e.g. "0x1a") */
  value?: string;
  gas?: number | string;
  chainId?: number;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  /** CIP-64: address of the ERC-20 fee currency adapter contract */
  feeCurrency?: `0x${string}`;
};
