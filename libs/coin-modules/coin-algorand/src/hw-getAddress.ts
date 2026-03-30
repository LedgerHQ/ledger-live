import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AlgorandSigner } from "./signer";

const resolver = (signerContext: SignerContext<AlgorandSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, verify || false));
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
