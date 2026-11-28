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

// r || s || v, with a v java-tron accepts: 0/1 or 27/28. ethers would also recover a 64-byte compact
// signature or an EIP-155 v, which the network rejects.
const TRON_SIGNATURE = /^[0-9a-f]{128}(?:00|01|1b|1c)$/i;

/** Inverse of {@link combine}: strips the length prefix and echoed tx to recover the raw signature. */
export function recoverDeviceSignature(rawDataHex: string, combinedSignature: string): string {
  const txLength = Number.parseInt(combinedSignature.slice(0, TX_LEN_PREFIX_HEX_WIDTH), 16);
  const txEnd = TX_LEN_PREFIX_HEX_WIDTH + rawDataHex.length;
  const signature = combinedSignature.slice(txEnd);
  // The echoed tx must be this one; who signed it is checked by the caller.
  if (
    txLength !== rawDataHex.length ||
    combinedSignature.slice(TX_LEN_PREFIX_HEX_WIDTH, txEnd) !== rawDataHex ||
    !TRON_SIGNATURE.test(signature)
  ) {
    throw new InvalidRawDataHex("Combined signature does not match the transaction to sign");
  }
  return signature;
}
