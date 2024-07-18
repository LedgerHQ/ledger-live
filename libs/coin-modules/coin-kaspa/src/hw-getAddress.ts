// import type { GetAddressFn } from "@ledgerhq/coin-kaspa/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-kaspa/signer";
// import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { KaspaAddress, KaspaSignature, KaspaSigner } from "./signer";
 
const resolver = (
  signerContext: SignerContext<KaspaSigner, KaspaAddress | KaspaSignature>,
) => {
  return async (deviceId: string, { path, verify }) => {
    const address = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify),
    )) as KaspaAddress;
    return {
      address: address.address,
      publicKey: address.publicKey,
      path,
    };
  };
};
 
export default resolver;