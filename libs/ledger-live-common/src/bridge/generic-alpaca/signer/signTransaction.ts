import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { XrpSigner } from "@ledgerhq/coin-xrp/index";
import { SignTransactionOptions } from "./types";
import { StellarSigner } from "@ledgerhq/coin-stellar/types/signer";
import TezosApp from "@ledgerhq/hw-app-tezos";

export const signTransaction = (signerContext: SignerContext<XrpSigner>) => {
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

export const tezosSignTransaction = (signerContext: SignerContext<TezosApp>) => {
  return async (deviceId: string, { path, rawTxHex }: SignTransactionOptions) => {
    const signed = await signerContext(deviceId, signer =>
      signer.signOperation(path, rawTxHex, {}),
    );
    return signed.signature; // tezos returns a hex/base64-like signature string
  };
};
