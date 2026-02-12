import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { XrpAddress, XrpSigner } from "../types/signer";

const getAddress = (signerContext: SignerContext<XrpSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify, false),
    )) as XrpAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
