/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @param tx - Serialized Transaction as base64 string
 * @param signature - base64(00||$signature||$pubkey)
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature to be used with {@link broadcast} function
 */
export function combine(tx: string, signature: string): string {
  return `${tx.length.toString(16).padStart(4, "0")}${tx}${signature}`;
}
