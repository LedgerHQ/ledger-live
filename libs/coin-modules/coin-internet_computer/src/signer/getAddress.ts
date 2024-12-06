import { log } from "@ledgerhq/logs";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { ICPSigner } from "../types";

function resolver(signerContext: SignerContext<ICPSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

    const { r } = await signerContext(deviceId, async signer => {
      const r = verify
        ? await signer.showAddressAndPubKey(path)
        : await signer.getAddressAndPubKey(path);

      return { r };
    });

    if (!r.address || !r.publicKey) {
      console.error("Failed to get address from device");
      throw Error("Failed to get address from device");
    }

    return {
      path,
      address: Buffer.from(r.address).toString("hex"),
      principalText: r.principalText,
      publicKey: Buffer.from(r.publicKey).toString("hex"),
    };
  };
}

export default resolver;
