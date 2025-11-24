import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AleoSigner } from "../types";

const getAddress = (signerContext: SignerContext<AleoSigner>): GetAddressFn => {
  return async (deviceId: string, { path }: GetAddressOptions) => {
    const address = await signerContext(deviceId, signer => signer.getAddress(path));
    return {
      path,
      publicKey: "",
      address: address.toString(),
    };
  };
};

export default getAddress;
