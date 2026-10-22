/**
 * Whether two byte arrays hold the same bytes. bitcoinjs-lib 7 returns `Uint8Array`, which has no
 * `equals`; an absent array equals nothing.
 */
export function sameBytes(a: Uint8Array | undefined, b: Uint8Array | undefined): boolean {
  return a !== undefined && b !== undefined && Buffer.from(a).equals(b);
}
