import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { StellarSigner } from "./types/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { StrKey } from "@stellar/stellar-sdk";

function resolver(signerContext: SignerContext<StellarSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { publicKey } = await signerContext(deviceId, async signer => {
      const { rawPublicKey } = await signer.getPublicKey(path, verify);
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);

      return { publicKey };
    });

    return {
      path,
      address: publicKey,
      publicKey,
    };
  };
}

export default resolver;
