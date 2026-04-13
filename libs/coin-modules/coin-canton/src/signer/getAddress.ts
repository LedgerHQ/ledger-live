import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { CantonAddress, CantonSigner } from "../types";

const getAddress = (signerContext: SignerContext<CantonSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey } = await signerContext(deviceId, signer =>
      signer.getAddress(path, verify),
    );

    return {
      path,
      address,
      publicKey,
    } satisfies CantonAddress;
  };
};

export default getAddress;
