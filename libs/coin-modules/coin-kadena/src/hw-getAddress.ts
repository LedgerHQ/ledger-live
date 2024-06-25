import { KadenaAddress, KadenaSignature, KadenaSigner } from "./signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

const resolver = (
  signerContext: SignerContext<KadenaSigner>,
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { publicKey } = (await signerContext(deviceId, signer =>
      verify ? signer.verifyAddress(path) : signer.getPublicKey(path),
    )) as KadenaAddress;

    const pubKeyStr = Buffer.from(publicKey).toString("hex");

    return {
      address: `k:${pubKeyStr}`,
      publicKey: pubKeyStr,
      path,
    };
  };
};

export default resolver;
