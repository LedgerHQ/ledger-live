import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { StellarSigner } from "@ledgerhq/coin-stellar/types/signer";
import { TezosSigner } from "@ledgerhq/coin-tezos/types/signer";
import { HederaSigner } from "@ledgerhq/coin-hedera/types/signer";
import { serializeSignature as serializeHederaSignature } from "@ledgerhq/coin-hedera/logic/utils";
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

export const tezosSignTransaction = (signerContext: SignerContext<TezosSigner>) => {
  return async (deviceId: string, { path, rawTxHex }: SignTransactionOptions) => {
    const signed = await signerContext(deviceId, signer =>
      signer.signOperation(path, rawTxHex, {}),
    );
    return signed.signature;
  };
};

export const hederaSignTransaction = (signerContext: SignerContext<HederaSigner>) => {
  return async (deviceId: string, { transaction }: SignTransactionOptions) => {
    const signedTx = await signerContext(deviceId, signer => signer.signTransaction(transaction));

    return serializeHederaSignature(signedTx);
  };
};
