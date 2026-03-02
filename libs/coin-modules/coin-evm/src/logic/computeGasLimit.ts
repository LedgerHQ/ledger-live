/**
 * This function is the implementation of the intrinsic gas limit computation as described in this document
 * https://github.com/wolflo/evm-opcodes/blob/main/gas.md#a0-0-intrinsic-gas
 *
 * The computation is the following:
 * intrisic gas limit = defaultGasLimit + 4 * null bytes count + 16 * non null bytes count
 *
 * Null bytes in a Buffer (data type of the calldata parameter) is represented by 0
 *
 * @param defaultGasLimit The minimum gas limit to start the computation on (at that time, 21 000)
 * @param callData the calldata of the transaction
 * @returns the intrinsic gas limit for a transaction
 */
export function computeIntrinsicGasLimit(defaultGasLimit: bigint, callData: Buffer): bigint {
  let intrinsicGasLimit = defaultGasLimit;
  for (let index = 0; index < callData.length; index++) {
    intrinsicGasLimit += callData[index] === 0 ? 4n : 16n;
  }

  return intrinsicGasLimit;
}
