import eip55 from "eip55";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerFactory } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { EvmSigner } from "./signer";

const resolver = (signerFactory: SignerFactory<EvmSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const signer = await signerFactory(deviceId);
    const { address, publicKey, chainCode } = await signer.getAddress(path, verify, false);

    return {
      address: eip55.encode(address),
      publicKey,
      chainCode,
      path,
    };
  };
};

export default resolver;
