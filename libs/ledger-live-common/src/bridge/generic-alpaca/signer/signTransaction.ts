import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { XrpSigner } from "@ledgerhq/coin-xrp/index";
import { SignTransactionOptions } from ".";

export const signTransaction = (signerContext: SignerContext<XrpSigner>) => {
  return async (deviceId: string, { path, rawTxHex }: SignTransactionOptions) => {
    const signedTx = await signerContext(deviceId, signer =>
      signer.signTransaction(path, rawTxHex),
    );

    return signedTx;
  };
};
