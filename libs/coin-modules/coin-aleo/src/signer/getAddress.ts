import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AleoSigner } from "../types";

const getAddress = (signerContext: SignerContext<AleoSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const address = await signerContext(deviceId, signer => signer.getAddress(path, verify));

    return {
      path,
      publicKey: "",
      address: address.toString(),
    };
  };
};

export default getAddress;
