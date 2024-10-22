import { log } from "@ledgerhq/logs";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { getPath, isError } from "../bridge/utils";
import { FilecoinSigner } from "../types";

function resolver(signerContext: SignerContext<FilecoinSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

    const { r } = await signerContext(deviceId, async signer => {
      const r = verify
        ? await signer.showAddressAndPubKey(getPath(path))
        : await signer.getAddressAndPubKey(getPath(path));

      isError(r);

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
