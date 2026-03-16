import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { XrpAddress, XrpSigner } from "./types";

const getAddress = (signerContext: SignerContext<XrpSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify, false),
    )) as XrpAddress;

    return {
      path,
      address,
      publicKey,
    };
  };
};

export default getAddress;
