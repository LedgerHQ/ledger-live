import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { TonSigner } from "./signer";
import { getLedgerTonPath } from "./utils";

const resolver = (signerContext: SignerContext<TonSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const ledgerPath = getLedgerTonPath(path);

    const sig = await signerContext(deviceId, async signer => {
      return verify
        ? await signer.validateAddress(ledgerPath, { bounceable: false })
        : await signer.getAddress(ledgerPath, { bounceable: false });
    });

    if (!sig.address || !sig.publicKey.length)
      throw Error(`[ton] Response is empty ${sig.address} ${sig.publicKey}`);

    return {
      address: sig.address,
      publicKey: sig.publicKey.toString("hex"),
      path,
    };
  };
};

export default resolver;
