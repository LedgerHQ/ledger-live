import eip55 from "eip55";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { CeloSigner } from ".";

/*
NOTE: we should use the evm resolver for celo, but due to the signer types conflicting for now 
we are using a separate resolver
*/
const resolver = (signerContext: SignerContext<CeloSigner>): GetAddressFn => {
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
