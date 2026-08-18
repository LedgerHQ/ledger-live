/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @returns Serialized Transaction (in its raw_data_tx form) and Signature
 */
export function combine(tx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Sui combine expects exactly one signature, got ${signature.length}`);
  }
  return `${tx.length.toString(16).padStart(4, "0")}${tx}${signature[0]}`;
}
