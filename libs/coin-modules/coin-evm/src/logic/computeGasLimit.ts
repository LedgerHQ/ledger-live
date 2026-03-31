/**
 * Compute gas limit according to https://eips.ethereum.org/EIPS/eip-7623
 *
 * The formula is:
 * `gasLimit = defaultGasLimit + 10 * (null bytes count + 4 * non null bytes count)`
 *
 * The EIP specifies we should take the maximum between intrinsic gas limit and EIP7623.
 * We did not implement that here because mathematically, intrinsic gas limit can never be higher than EIP7623:
 *
 * - eip7623   = defaultGasLimit + 10 * (null bytes count + 4 * non null bytes count)
 *             = defaultGasLimit + 10 * null bytes count + 40 * non null bytes count
 * - intrinsic = defaultGasLimit + 4 * null bytes count + 16 * non null bytes count
 *
 * EIP-7623 adds more value per byte than the intrinsic computation, so the computed value will always be higher
 *
 * @param defaultGasLimit The minimum gas limit to start the computation on (at that time, 21 000)
 * @param callData The calldata of the transaction
 * @returns The gas limit according to EIP-7623
 */
export function computeEIP7623GasLimit(defaultGasLimit: bigint, callData: Buffer): bigint {
  let tokensInCalldata = 0n;
  for (const byte of callData) {
    tokensInCalldata += byte === 0 ? 1n : 4n;
  }

  return defaultGasLimit + 10n * tokensInCalldata;
}
