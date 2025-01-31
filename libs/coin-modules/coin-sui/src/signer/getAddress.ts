import { log } from "@ledgerhq/logs";
import type { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { SuiSigner } from "../types";

const resolver = (signerContext: SignerContext<SuiSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

    const result = await signerContext(deviceId, signer => signer.getPublicKey(path, verify));

    if (!result.address || !result.publicKey) {
      console.error("Failed to get address from device");
      throw Error("Failed to get address from device");
    }

    return {
      address: Buffer.from(result.address).toString("hex"),
      publicKey: Buffer.from(result.publicKey).toString("hex"),
      path,
    };
  };
};

export default resolver;
