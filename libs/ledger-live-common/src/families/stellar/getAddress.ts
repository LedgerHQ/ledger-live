import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { StrKey } from "@stellar/stellar-sdk";
import { StellarSigner } from "./types";

function getAddress(signerContext: SignerContext<StellarSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const rawPublicKey = await signerContext(deviceId, async signer => {
      const { rawPublicKey } = await signer.getPublicKey(path, verify);
      return rawPublicKey;
    });

    const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);

    return {
      path,
      address: publicKey,
      publicKey: rawPublicKey.toString("hex"),
    };
  };
}

export default getAddress;
