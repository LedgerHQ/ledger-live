import { log } from "@ledgerhq/logs";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CLPublicKeyTag } from "casper-js-sdk";
import { casperAddressFromPubKey } from "../bridge/bridgeHelpers/addresses";
import { CasperSigner } from "../types";

function resolver(signerContext: SignerContext<CasperSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    log("debug", "start getAddress process");

    const { r } = await signerContext(deviceId, async signer => {
      const r = verify
        ? await signer.showAddressAndPubKey(path)
        : await signer.getAddressAndPubKey(path);

      return { r };
    });

    if (!r.Address || !r.publicKey) {
      console.error(`Failed to get address from device ${JSON.stringify(r)}`);
      throw Error(`Failed to get address from device ${JSON.stringify(r)}`);
    }

    return {
      path,
      address: r.Address.length
        ? r.Address.toString().toLowerCase()
        : // Buffer.from(r.Address).toString("hex")
          casperAddressFromPubKey(r.publicKey, CLPublicKeyTag.SECP256K1),
      // : casperAddressFromPubKey(r.publicKey, CLPublicKeyTag.SECP256K1),
      publicKey: r.publicKey.toString("hex"),
      // publicKey: Buffer.from(r.publicKey).toString("hex"),
    };
  };
}

export default resolver;
