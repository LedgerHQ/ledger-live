import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { ConcordiumSigner } from "../types";

const PUBLIC_KEY_LENGTH = 64; // Ed25519 public key length (32 bytes = 64 hex chars)

/**
 * Get public key from device for Concordium account
 *
 * @param signerContext - Signer context for device access
 * @param deviceId - Device ID
 * @param path - BIP32 derivation path
 * @returns Public key as hex string (64 characters)
 */
export async function getPublicKey(
  signerContext: SignerContext<ConcordiumSigner>,
  deviceId: string,
  path: string,
): Promise<string> {
  const result = await signerContext(deviceId, async signer => {
    return signer.getAddress(path, false);
  });

  const publicKey = result.publicKey || "";
  if (!publicKey || typeof publicKey !== "string") {
    throw new Error("Invalid public key: must be a hex string");
  }

  const trimmed = publicKey.trim();
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error(
      `Invalid public key format: expected hex string, got ${trimmed.slice(0, 20)}...`,
    );
  }

  if (trimmed.length !== PUBLIC_KEY_LENGTH) {
    if (trimmed.length < PUBLIC_KEY_LENGTH) {
      return trimmed.padEnd(PUBLIC_KEY_LENGTH, "0");
    } else {
      return trimmed.slice(0, PUBLIC_KEY_LENGTH);
    }
  }

  return trimmed;
}
