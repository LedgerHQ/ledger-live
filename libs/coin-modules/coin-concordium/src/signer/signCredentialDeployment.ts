import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CredentialDeploymentTransaction } from "@ledgerhq/hw-app-concordium/lib/types";
import type { ConcordiumSigner } from "../types";

/**
 * Sign a credential deployment transaction using the Ledger device.
 *
 * Always creates credentials for new accounts on existing identities (Ledger Live use case).
 * The device displays the expiry time for user verification.
 *
 * @param signerContext - Signer context for device access
 * @param deviceId - Device identifier
 * @param transaction - Credential deployment transaction in hw-app format
 * @param path - BIP32 derivation path for signing key
 * @returns Signature from device (hex string)
 */
export async function signCredentialDeployment(
  signerContext: SignerContext<ConcordiumSigner>,
  deviceId: string,
  transaction: CredentialDeploymentTransaction,
  path: string,
): Promise<string> {
  return signerContext(deviceId, async signer => {
    return await signer.signCredentialDeployment(transaction, path);
  });
}
