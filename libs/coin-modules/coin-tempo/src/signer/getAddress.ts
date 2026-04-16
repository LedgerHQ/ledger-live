import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { TempoAddress, TempoSigner } from "../types";

const getAddress = (signerContext: SignerContext<TempoSigner>): GetAddressFn => {
  return async (deviceId: string, { path }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path),
    )) as TempoAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
