import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { ElrondSigner } from "./signer";

const resolver = (signerContext: SignerContext<ElrondSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer =>
      signer.getAddress(path, verify || false),
    );
    return {
      address: address,
      publicKey: publicKey,
      path,
    };
  };
};

export default resolver;
