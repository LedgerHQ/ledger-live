import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import Stellar from "@ledgerhq/hw-app-str";
import { signTransaction, stellarSignTransaction } from "./signTransaction";
import { StrKey } from "@stellar/stellar-sdk";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import { AlpacaSigner } from "./types";

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

export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      return {
        getAddress: xrpGetAddress(signerContextXrp),
        signTransaction: signTransaction(signerContextXrp),
        context: signerContextXrp,
      };
    }
    case "stellar": {
      return {
        getAddress: stellarGetAddress(signerContextStellar),
        signTransaction: stellarSignTransaction(signerContextStellar),
        context: signerContextStellar,
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
