import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { AptosSigner } from "../types";

const resolver = (signerContext: SignerContext<AptosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, verify || false));
    return {
      address: r.address,
      publicKey: r.publicKey.toString("hex"),
      path,
    };
  };
};

export default resolver;
