import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { XrpAddress, XrpSigner } from "./signer";

const resolver = (signerContext: SignerContext<XrpSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey, chainCode } = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify, false),
    )) as XrpAddress;

    return {
      path,
      address,
      publicKey,
      chainCode,
    };
  };
};

export default resolver;
