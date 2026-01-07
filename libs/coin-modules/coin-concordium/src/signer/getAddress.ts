import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { ConcordiumAddress, ConcordiumSigner } from "../types";

const getAddress = (signerContext: SignerContext<ConcordiumSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path),
    )) as ConcordiumAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
