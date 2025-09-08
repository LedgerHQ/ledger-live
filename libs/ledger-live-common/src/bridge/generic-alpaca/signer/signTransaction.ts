import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { XrpSigner } from "@ledgerhq/coin-xrp/index";
import { SignTransactionOptions } from "./types";
import { StellarSigner } from "@ledgerhq/coin-stellar/types/signer";
import { HederaSigner } from "@ledgerhq/coin-hedera/lib/types/signer";

export const xrpSignTransaction = (signerContext: SignerContext<XrpSigner>) => {
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

export const hederaSignTransaction = (signerContext: SignerContext<HederaSigner>) => {
  return async (deviceId: string, { transaction }: SignTransactionOptions) => {
    const signedTx = await signerContext(deviceId, signer => signer.signTransaction(transaction));

    return Buffer.from(signedTx).toString("base64");
  };
};
