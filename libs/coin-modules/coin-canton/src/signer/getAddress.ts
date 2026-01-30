import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonAddress, CantonSigner } from "../types";

const getAddress = (signerContext: SignerContext<CantonSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer =>
      signer.getAddress(path, verify),
    );

    return {
      path,
      address,
      publicKey,
    } satisfies CantonAddress;
  };
};

export default getAddress;
