/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @param tx 
 * @param signature 
 * @returns 
 */
export function combine(tx: string, signature: string): string {
  return `${tx.length.toString(16).padStart(4, "0")}${tx}${signature}`;
}
