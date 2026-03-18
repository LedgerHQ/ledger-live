import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { IconAddress, IconSigner } from "./signer";

const resolver = (signerContext: SignerContext<IconSigner>): GetAddressFn => {
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
