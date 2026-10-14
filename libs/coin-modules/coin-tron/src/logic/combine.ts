import { InvalidRawDataHex } from "../types/errors";

// Shared with recoverDeviceSignature and broadcast's extractTxAndSignature so the width never drifts.
export const TX_LEN_PREFIX_HEX_WIDTH = 4;

/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature
 */
export function combine(tx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Tron combine expects exactly one signature, got ${signature.length}`);
  }
  // tx.length must fit the fixed-width prefix, or recoverDeviceSignature slices at the wrong offset.
  const maxTxLength = 16 ** TX_LEN_PREFIX_HEX_WIDTH - 1;
  if (tx.length > maxTxLength) {
    throw new InvalidRawDataHex(
      `Tron combine tx too long to length-prefix: ${tx.length} hex chars`,
    );
  }

  return `${tx.length.toString(16).padStart(TX_LEN_PREFIX_HEX_WIDTH, "0")}${tx}${signature[0]}`;
}

/** Inverse of {@link combine}: strips the length prefix and echoed tx to recover the raw signature. */
export function recoverDeviceSignature(rawDataHex: string, combinedSignature: string): string {
  const txLength = Number.parseInt(combinedSignature.slice(0, TX_LEN_PREFIX_HEX_WIDTH), 16);
  const txEnd = TX_LEN_PREFIX_HEX_WIDTH + rawDataHex.length;
  const signature = combinedSignature.slice(txEnd);
  // A signature over other bytes must not be attached to this transaction.
  if (
    txLength !== rawDataHex.length ||
    combinedSignature.slice(TX_LEN_PREFIX_HEX_WIDTH, txEnd) !== rawDataHex ||
    signature.length === 0
  ) {
    throw new InvalidRawDataHex("Combined signature does not match the transaction to sign");
  }
  return signature;
}
