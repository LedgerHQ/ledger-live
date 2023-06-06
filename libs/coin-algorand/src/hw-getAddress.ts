import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerFactory } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { AlgorandSigner } from "./signer";

const resolver = (
  signerFactory: SignerFactory<AlgorandSigner>
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const signer = await signerFactory(deviceId);
    const r = await signer.getAddress(path, verify || false);
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
