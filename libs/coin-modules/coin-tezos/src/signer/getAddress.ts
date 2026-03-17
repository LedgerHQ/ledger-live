import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TezosSigner } from "../types";

const getAddress = (signerContext: SignerContext<TezosSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const r = await signerContext(deviceId, signer => signer.getAddress(path, { verify }));
    return { ...r, path };
  };
};

export default getAddress;
