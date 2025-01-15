import { log } from "@ledgerhq/logs";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { AptosSigner } from "../types";

function resolver(signerContext: SignerContext<AptosSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start resolver process");

    const { r } = await signerContext(deviceId, async signer => {
      const r = verify
        ? await signer.showAddressAndPubKey(path)
        : await signer.getAddressAndPubKey(path);

      return { r };
    });

    return {
      path,
      address: r.addrString,
      publicKey: Buffer.from(r.compressed_pk).toString("hex"),
    };
  };
}

export default resolver;
