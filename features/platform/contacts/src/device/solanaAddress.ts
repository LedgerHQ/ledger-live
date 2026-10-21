import bs58 from "bs58";

const SOLANA_ADDRESS_LENGTH = 32;

/**
 * Decodes a base58 Solana address to the 32-byte public key the device
 * registers and the Solana signer provides, or `null` when it is malformed
 * (bad alphabet or wrong length). Solana addresses carry no checksum, so the
 * length is the only structural check available.
 */
export function tryDecodeSolanaAddress(address: string): Uint8Array | null {
  let decoded: Uint8Array;
  try {
    decoded = Uint8Array.from(bs58.decode(address));
  } catch {
    return null;
  }

  return decoded.length === SOLANA_ADDRESS_LENGTH ? decoded : null;
}
