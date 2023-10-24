import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { PolkadotAddress, PolkadotSignature, PolkadotSigner } from "./types";

const resolver = (
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify),
    )) as PolkadotAddress;
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default resolver;
