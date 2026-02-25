import type { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import type { SuiSigner } from "../types";
import { ensureAddressFormat } from "../utils";

const resolver = (signerContext: SignerContext<SuiSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

    const result = await signerContext(deviceId, signer => signer.getPublicKey(path, verify));

    if (!result.address || !result.publicKey) {
      throw Error("Failed to get address from device");
    }

    return {
      address: ensureAddressFormat(Buffer.from(result.address).toString("hex")),
      publicKey: Buffer.from(result.publicKey).toString("hex"),
      path,
    };
  };
};

export default resolver;
