import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { PolkadotSigner } from "./signer";

const resolver = (signer: PolkadotSigner): GetAddressFn => {
  return async ({ path, verify }) => {
    const r = await signer.getAddress(path, verify);
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default resolver;
