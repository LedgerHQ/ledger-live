import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Stellar from "@ledgerhq/hw-app-str";

import Transport from "@ledgerhq/hw-transport";
import { signTransaction, stellarSignTransaction } from "./signTransaction";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { SignTransactionOptions } from "./types";
import { StrKey } from "@stellar/stellar-sdk";

export type AlpacaSigner = {
  getAddress: GetAddressFn;
  signTransaction?: (deviceId: string, opts: SignTransactionOptions) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<any>;
};

const createSignerXrp: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};
const signerContextXrp = executeWithSigner(createSignerXrp);

const createSignerStellar: CreateSigner<Stellar> = (transport: Transport) => {
  const stellar = new Stellar(transport);
  const originalSignTransaction = stellar.signTransaction;
  // Return the original Stellar instance with overridden methods
  return Object.assign(stellar, {
    signTransaction: async (path: string, transaction: string) => {
      const unsignedPayload: Buffer = Buffer.from(transaction, "base64");
      const { signature } = await originalSignTransaction(path, unsignedPayload);
      return signature.toString("base64");
    },
    getAddress: async (path: string, verify?: boolean) => {
      const { rawPublicKey } = await stellar.getPublicKey(path, verify);
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
      return {
        path,
        address: publicKey,
        publicKey: publicKey,
      };
    },
  });
};

const signerContextStellar = executeWithSigner(createSignerStellar);

export function getSigner(network): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      // const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
      //   return new Xrp(transport);
      // };
      return {
        getAddress: xrpGetAddress(signerContextXrp),
        signTransaction: signTransaction(signerContextXrp),
        context: signerContextXrp,
      };
    }
    case "stellar": {
      // const createSigner: CreateSigner<Stellar> = (transport: Transport) => {
      //   return new Stellar(transport);
      // };
      return {
        getAddress: stellarGetAddress(signerContextStellar),
        signTransaction: stellarSignTransaction(signerContextStellar),
        context: signerContextStellar,
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
