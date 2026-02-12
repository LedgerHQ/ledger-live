import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { ConcordiumSigner } from "../types";

/**
 * Get public key from device for Concordium account.
 *
 * @param signerContext - Signer context for device access
 * @param deviceId - Device ID
 * @param path - BIP32 derivation path
 * @returns Public key as hex string from device
 */
export async function getPublicKey(
  signerContext: SignerContext<ConcordiumSigner>,
  deviceId: string,
  path: string,
): Promise<string> {
  return signerContext(deviceId, async signer => {
    return signer.getPublicKey(path, false);
  });
}
