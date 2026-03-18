import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { log } from "@ledgerhq/logs";
import { FilecoinSigner } from "../types";

function resolver(signerContext: SignerContext<FilecoinSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

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
