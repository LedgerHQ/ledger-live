import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonAddress, CantonSigner } from "../types";

const getAddress = (signerContext: SignerContext<CantonSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path),
    )) as CantonAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
