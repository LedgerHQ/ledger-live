import type { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { SuiSigner } from "../types";

const resolver = (signerContext: SignerContext<SuiSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const result = await signerContext(deviceId, signer => signer.getAddress(path, verify));

    return {
      address: result.address,
      publicKey: result.publicKey,
      path,
    };
  };
};

export default resolver;
