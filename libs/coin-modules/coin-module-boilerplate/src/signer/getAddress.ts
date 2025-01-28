import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { BOilerplateAddress, BoilerplateSigner } from "../types";

const getAddress = (signerContext: SignerContext<BoilerplateSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path),
    )) as BOilerplateAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
