import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AleoSigner } from "../types";

const getAddress = (signerContext: SignerContext<AleoSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const address = await signerContext(deviceId, signer => signer.getAddress(path, verify));

    return {
      path,
      publicKey: "",
      address: address.toString(),
    };
  };
};

export default getAddress;
