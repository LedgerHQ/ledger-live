import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { AptosSigner } from "../types";

export const signerGetAddress = (signerContext: SignerContext<AptosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, 0, verify));
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};
