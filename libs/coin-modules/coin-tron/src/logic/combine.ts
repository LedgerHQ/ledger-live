// Hex-digit width of the length prefix `combine` prepends. Shared by every reader of that prefix —
// `recoverDeviceSignature` here and broadcast's `extractTxAndSignature` — so the width never drifts.
export const TX_LEN_PREFIX_HEX_WIDTH = 4;

/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature
 */
export function combine(tx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Tron combine expects exactly one signature, got ${signature.length}`);
  }
  // The prefix is TX_LEN_PREFIX_HEX_WIDTH hex digits, so tx.length must fit — otherwise it overflows
  // the fixed width and recoverDeviceSignature slices at the wrong offset. TRON raw_data_hex is only
  // hundreds of chars, so this never fires; it guards against a future caller feeding a larger payload.
  const maxTxLength = 16 ** TX_LEN_PREFIX_HEX_WIDTH - 1;
  if (tx.length > maxTxLength) {
    throw new Error(`Tron combine tx too long to length-prefix: ${tx.length} hex chars`);
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
