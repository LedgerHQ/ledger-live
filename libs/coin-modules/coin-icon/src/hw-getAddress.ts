import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { IconAddress, IconSignature, IconSigner } from "./signer";

const resolver = (
  signerContext: SignerContext<IconSigner, IconAddress | IconSignature>,
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify || false),
    )) as IconAddress;
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
