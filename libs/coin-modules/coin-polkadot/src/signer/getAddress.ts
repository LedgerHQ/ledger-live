import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getSs58Prefix } from "../common";
import type { PolkadotSigner } from "../types";

const getAddress = (signerContext: SignerContext<PolkadotSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const ss58prefix = getSs58Prefix(currency?.id);
    const r = await signerContext(deviceId, signer => signer.getAddress(path, ss58prefix, verify));
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default getAddress;
