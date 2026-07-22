/**
 * Zcash (UTXO + note-based) has no account sequence/nonce concept -- kaspa /
 * boilerplate UTXO pattern: not applicable, so this always throws.
 */
export async function getNextValidSequence(_address: string): Promise<bigint> {
  throw new Error("getNextSequence is not supported: Zcash has no account sequence number");
}
