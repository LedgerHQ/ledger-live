// Hex-digit width of the length prefix `combine` prepends; `recoverDeviceSignature` slices it back off.
// Shared so the two never drift.
const TX_LEN_PREFIX_HEX_WIDTH = 4;

/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature
 */
export function combine(tx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Tron combine expects exactly one signature, got ${signature.length}`);
  }

  return `${tx.length.toString(16).padStart(TX_LEN_PREFIX_HEX_WIDTH, "0")}${tx}${signature[0]}`;
}

/**
 * Inverse of {@link combine}: recover the raw device signature from the combined string the generic
 * raw-sign device path returns. `combine` prepends the length prefix and echoes the signed `tx` (an
 * energy-rent order's `raw_data_hex`), so the signature is everything after both.
 */
export function recoverDeviceSignature(rawDataHex: string, combinedSignature: string): string {
  return combinedSignature.slice(TX_LEN_PREFIX_HEX_WIDTH + rawDataHex.length);
}
