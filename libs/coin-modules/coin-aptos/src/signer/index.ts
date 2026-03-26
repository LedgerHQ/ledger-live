import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AptosSigner } from "../types";

const resolver = (signerContext: SignerContext<AptosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, verify || false));
    return {
      address: r.address,
      publicKey: r.publicKey.toString("hex"),
      path,
    };
  };
};

export default resolver;
