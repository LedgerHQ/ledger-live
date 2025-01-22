import { HederaSigner } from "../types";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";

const resolver = (signerContext: SignerContext<HederaSigner>): GetAddressFn => {
  return async (deviceId: string, { path, derivationMode }: GetAddressOptions) => {
    let publicKey = "";
    publicKey = await signerContext(deviceId, signer => signer.getPublicKey(path));
    if (derivationMode == "hederaBip44Ecdsa") {
      publicKey = await signerContext(deviceId, signer => signer.getPublicKey(path, true));
    }

    return {
      path,
      // NOTE: we do not have the address, it must be entered by the user
      // NOTE: we send the publicKey through as the "address"
      //       this is the only way to pass several hard-coded "is this the right device" checks
      address: publicKey,
      publicKey,
    };
  };
};

export default resolver;
