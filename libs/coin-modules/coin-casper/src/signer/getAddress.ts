import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { log } from "@ledgerhq/logs";
import { KeyAlgorithm } from "casper-js-sdk";
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

    return {
      path,
      address: r.Address.length
        ? r.Address.toString().toLowerCase()
        : casperAddressFromPubKey(r.publicKey, KeyAlgorithm.SECP256K1),
      publicKey: r.publicKey.toString("hex"),
    };
  };
}

export default resolver;
