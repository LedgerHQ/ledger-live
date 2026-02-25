import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { BoilerplateAddress, BoilerplateSigner } from "../types";

const getAddress = (signerContext: SignerContext<BoilerplateSigner>): GetAddressFn => {
  return async (deviceId: string, { path }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path),
    )) as BoilerplateAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
