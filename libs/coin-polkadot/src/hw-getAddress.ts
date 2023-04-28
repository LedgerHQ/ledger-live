import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerFactory } from "./signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";

const resolver = (signerFactory: SignerFactory): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const signer = await signerFactory(deviceId);
    const r = await signer.getAddress(path, verify);
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default resolver;
