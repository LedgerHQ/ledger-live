/**
 * A secp256k1 public key in compressed form (33 bytes), which every address type the module spends
 * from commits to.
 *
 * Ledger's bitcoin signers return the uncompressed form (65 bytes, `04 ‖ x ‖ y`), so it is
 * compressed here: `02 ‖ x` for an even `y`, `03 ‖ x` for an odd one.
 */
export function compressPublicKey(publicKey: string | Buffer): Buffer {
  const key = typeof publicKey === "string" ? Buffer.from(publicKey, "hex") : publicKey;
  if (key.length === 33 && (key[0] === 0x02 || key[0] === 0x03)) return key;
  if (key.length === 65 && key[0] === 0x04) {
    const prefix = key[64] % 2 === 0 ? 0x02 : 0x03;
    return Buffer.concat([Buffer.from([prefix]), key.subarray(1, 33)]);
  }
  throw new Error("invalid public key");
}
