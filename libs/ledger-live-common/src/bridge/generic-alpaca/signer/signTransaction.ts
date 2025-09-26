import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { StellarSigner } from "@ledgerhq/coin-stellar/types/signer";
import { LegacySigner, SignTransactionOptions } from "./types";

export const signTransaction = <Signer extends LegacySigner>(
  signerContext: SignerContext<Signer>,
) => {
  return async (deviceId: string, { path, rawTxHex }: SignTransactionOptions) => {
    const signedTx = await signerContext(deviceId, signer =>
      signer.signTransaction(path, rawTxHex),
    );

    return signedTx;
  };
};

export const stellarSignTransaction = (signerContext: SignerContext<StellarSigner>) => {
  return async (deviceId: string, { path, transaction }: SignTransactionOptions) => {
    const signedTx = await signerContext(deviceId, signer =>
      signer.signTransaction(path, transaction),
    );

    return signedTx.signature.toString("base64"); // It should return a Buffer
  };
};
