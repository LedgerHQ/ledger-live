import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { KadenaAddress, KadenaSigner } from "./signer";
import { getPath } from "./utils";

const resolver = (signerContext: SignerContext<KadenaSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, pubkey } = (await signerContext(deviceId, signer =>
      signer.getAddressAndPubKey(getPath(path), verify),
    )) as KadenaAddress;

    const pubKeyStr = Buffer.from(pubkey).toString("hex");

    return {
      address: address.length ? address.toString().toLowerCase() : `k:${pubKeyStr}`,
      publicKey: pubKeyStr,
      path,
    };
  };
};

export default resolver;
