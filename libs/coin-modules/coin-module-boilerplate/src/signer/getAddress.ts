import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { BoilerplateSigner } from "../types";

const getAddress = (signerContext: SignerContext<BoilerplateSigner>): GetAddressFn => {
  return async (deviceId: string, { path }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer => signer.getAddress(path));

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
