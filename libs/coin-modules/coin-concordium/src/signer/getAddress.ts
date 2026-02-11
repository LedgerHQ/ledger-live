import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { ConcordiumSigner } from "../types";

/**
 * Get address for Concordium account
 *
 * IMPORTANT: For Concordium, on-chain addresses are NOT derived from BIP32 paths.
 * They are computed as SHA256(credId), where credId is derived from identity/credential parameters.
 *
 * This function returns:
 * - publicKey: The public key at the BIP32 path (used for signing transactions)
 * - address: A BIP32-derived address (used for device matching via seedIdentifier, NOT the on-chain address)
 *
 * For address verification on device, use the custom receive flow which calls verifyAddress.
 * For onboarding, this returns the publicKey needed for credential deployment and the BIP32 address for device matching.
 */
export const getAddress = (signerContext: SignerContext<ConcordiumSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer =>
      signer.getAddress(path, verify),
    );

    return {
      path,
      address,
      publicKey,
    };
  };
};
