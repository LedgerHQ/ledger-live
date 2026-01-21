import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AccountAddress } from "@ledgerhq/concordium-sdk-adapter";
import type { CredentialDeploymentTransaction } from "@ledgerhq/concordium-sdk-adapter";
import type {
  CredentialDeploymentTransaction as HwCredentialDeploymentTransaction,
  SignCredentialDeploymentMetadata,
} from "@ledgerhq/hw-app-concordium/lib/types";
import { serializeIdOwnershipProofs } from "@ledgerhq/hw-app-concordium/lib/utils";
import type { ConcordiumSigner } from "../types";

/**
 * Transforms SDK CredentialDeploymentTransaction to hw-app format.
 * Converts nested structures and serializes proofs to hex string.
 */
function transformCredentialDeploymentTransaction(
  sdkCdt: CredentialDeploymentTransaction,
): HwCredentialDeploymentTransaction {
  // Transform credential public keys
  const credentialPublicKeys = {
    keys: Object.fromEntries(
      Object.entries(sdkCdt.unsignedCdi.credentialPublicKeys.keys).map(([idx, key]) => [
        parseInt(idx, 10),
        {
          schemeId: key.schemeId,
          verifyKey: key.verifyKey,
        },
      ]),
    ),
    threshold: sdkCdt.unsignedCdi.credentialPublicKeys.threshold,
  };

  // Transform AR data
  const arData = Object.fromEntries(
    Object.entries(sdkCdt.unsignedCdi.arData).map(([arIdentity, data]) => [
      arIdentity,
      {
        encIdCredPubShare: data.encIdCredPubShare,
      },
    ]),
  );

  // Serialize proofs if they're in object format
  let proofsHex: string;
  if (typeof sdkCdt.unsignedCdi.proofs === "string") {
    proofsHex = sdkCdt.unsignedCdi.proofs;
  } else {
    // Convert IdOwnershipProofs object to hex string
    proofsHex = serializeIdOwnershipProofs(sdkCdt.unsignedCdi.proofs);
  }

  return {
    credentialPublicKeys,
    credId: sdkCdt.unsignedCdi.credId,
    ipIdentity: sdkCdt.unsignedCdi.ipIdentity,
    revocationThreshold: sdkCdt.unsignedCdi.revocationThreshold,
    arData,
    policy: {
      validTo: sdkCdt.unsignedCdi.policy.validTo,
      createdAt: sdkCdt.unsignedCdi.policy.createdAt,
      revealedAttributes: sdkCdt.unsignedCdi.policy.revealedAttributes,
    },
    proofs: proofsHex,
    expiry: sdkCdt.expiry.expiryEpochSeconds,
  };
}

/**
 * Transforms metadata for credential deployment.
 * Converts Base58 address string to raw bytes if present.
 */
function transformCredentialMetadata(metadata?: {
  isNew?: boolean;
  address?: string;
}): SignCredentialDeploymentMetadata | undefined {
  if (!metadata) return undefined;

  const result: SignCredentialDeploymentMetadata = {};

  if (metadata.isNew !== undefined) {
    result.isNew = metadata.isNew;
  }

  if (metadata.address !== undefined) {
    result.address = Buffer.from(
      AccountAddress.toBuffer(AccountAddress.fromBase58(metadata.address)),
    );
  }

  return result;
}

/**
 * Sign a credential deployment transaction using the Ledger device.
 *
 * This is the glue layer between SDK types and hw-app-concordium.
 * Accepts SDK CredentialDeploymentTransaction, transforms to hw-app format,
 * calls device, and wraps result for compatibility.
 *
 * @param signerContext - Signer context for device access
 * @param deviceId - Device identifier
 * @param path - BIP32 derivation path for signing key
 * @param transaction - Credential deployment transaction in SDK format
 * @param metadata - Optional metadata (default: { isNew: true } for onboarding flow)
 * @returns Wrapped signature array
 */
export async function signCredentialDeployment(
  signerContext: SignerContext<ConcordiumSigner>,
  deviceId: string,
  path: string,
  transaction: CredentialDeploymentTransaction,
  metadata: { isNew?: boolean; address?: string } = { isNew: true },
): Promise<string> {
  return signerContext(deviceId, async signer => {
    // Transform SDK transaction to hw-app format
    const payload = transformCredentialDeploymentTransaction(transaction);
    const _metadata = transformCredentialMetadata(metadata);

    const signature = await signer.signCredentialDeployment(payload, path, _metadata);

    return signature;
  });
}
