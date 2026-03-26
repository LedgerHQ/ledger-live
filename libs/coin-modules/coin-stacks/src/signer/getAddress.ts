import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AddressVersion } from "@stacks/transactions/dist";
import { StacksSigner } from "../types";
import { getPath, throwIfError } from "../utils";

const resolver = (signerContext: SignerContext<StacksSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, async signer => {
      const r = verify
        ? await signer.showAddressAndPubKey(getPath(path), AddressVersion.MainnetSingleSig)
        : await signer.getAddressAndPubKey(getPath(path), AddressVersion.MainnetSingleSig);
      return r;
    });

    throwIfError(r);

    return {
      path,
      address: r.address,
      publicKey: r.publicKey.toString("hex"),
    };
  };
};

export default resolver;
