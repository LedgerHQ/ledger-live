import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import eip55 from "eip55";
import { VechainSigner } from "./signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/lib/derivation";

const resolver = (signerContext: SignerContext<VechainSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const sig = await signerContext(deviceId, async signer => {
      return await signer.getAddress(path, verify, false); // Note: Do we need to check askChainCode or false?
    });

    if (!sig.address || !sig.publicKey.length)
      throw Error(`[vechain] Response is empty ${sig.address} ${sig.publicKey}`);
  
    const address = eip55.encode(sig.address)
    return {
      address,
      publicKey: sig.publicKey,
      path,
    };
  };
};

export default resolver;
