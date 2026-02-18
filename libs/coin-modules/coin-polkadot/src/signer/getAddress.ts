import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { PolkadotSigner } from "../types";

const getAddress = (signerContext: SignerContext<PolkadotSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, 0, verify));
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default getAddress;
