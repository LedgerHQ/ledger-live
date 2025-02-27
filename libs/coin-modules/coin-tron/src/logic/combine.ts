/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature
 */
export function combine(tx: string, signature: string): string {
  return `${tx.length.toString(16).padStart(4, "0")}${tx}${signature}`;
}
