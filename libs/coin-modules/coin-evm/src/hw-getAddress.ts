import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import eip55 from "eip55";
import { EvmSigner } from "./types/signer";

const resolver = (signerContext: SignerContext<Pick<EvmSigner, "getAddress">>): GetAddressFn => {
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
