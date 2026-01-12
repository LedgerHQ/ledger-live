import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AleoSigner } from "../types";

const getAddress = (signerContext: SignerContext<AleoSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const address = await signerContext(deviceId, signer => signer.getAddress(path, verify));

    // FIXME: device app returns the same address, no matter what the path is
    // we hardcode it temporary to avoid infinite loop
    const index = Number(path.split("/")[2].replace("'", ""));
    const secondAccountAddress = "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu";
    const emptyAccountAddress = "aleo1tt6qjd0g0hyf0g3psextkph9hpw333ewun95sxvw7gdnquqppczsk5gnhu";
    const mockAddress = (() => {
      if (index === 0) return address.toString();
      if (index === 1) return secondAccountAddress;
      return emptyAccountAddress;
    })();

    return {
      path,
      publicKey: "",
      address: mockAddress,
    };
  };
};

export default getAddress;
