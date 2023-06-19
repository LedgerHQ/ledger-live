import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { AlgorandAddress, AlgorandSignature, AlgorandSigner } from "./signer";

const resolver = (
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify || false),
    )) as AlgorandAddress;
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
