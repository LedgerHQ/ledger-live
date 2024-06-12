import eip55 from "eip55";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { EvmSigner } from "./types/signer";

const resolver = (signerContext: SignerContext<EvmSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer => {
      /* istanbul ignore next: optional chaining + undefined is a valid value */
      const chainId = currency?.ethereumLikeInfo?.chainId.toString();
      return signer.getAddress(path, verify, false, chainId);
    });

    return {
      address: eip55.encode(address),
      publicKey,
      path,
    };
  };
};

export default resolver;
