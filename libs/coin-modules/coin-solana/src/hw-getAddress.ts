import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SolanaSigner } from "./signer";

import bs58 from "bs58";

const resolver = (signerContext: SignerContext<SolanaSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address } = await signerContext(deviceId, signer => signer.getAddress(path, verify));

    const publicKey = bs58.encode(address);

    return {
      address: publicKey,
      publicKey,
      path,
    };
  };
};

export default resolver;
