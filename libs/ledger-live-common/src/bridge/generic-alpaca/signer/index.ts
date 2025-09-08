import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import hederaGetAddress from "@ledgerhq/coin-hedera/signer/getAddress";
import {
  deserializeTransaction as deserializeHederaTransaction,
  serializeSignature as serializeHederaSignature,
} from "@ledgerhq/coin-hedera/logic/utils";
import { getHederaTransactionBodyBytes } from "@ledgerhq/coin-hedera/logic/utils";
import Stellar from "@ledgerhq/hw-app-str";
import { signTransaction, stellarSignTransaction, hederaSignTransaction } from "./signTransaction";
import { StrKey } from "@stellar/stellar-sdk";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Hedera from "@ledgerhq/hw-app-hedera";
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

const createSignerHedera: CreateSigner<Hedera> = (transport: Transport) => {
  const hedera = new Hedera(transport);
  const originalSignTransaction = hedera.signTransaction.bind(hedera);

  // Return the original Hedera instance with overridden/additional methods
  return Object.assign(hedera, {
    signTransaction: async (_path: string, transaction: string) => {
      const tx = deserializeHederaTransaction(transaction);
      const txBodyBytes = getHederaTransactionBodyBytes(tx);
      const signature = await originalSignTransaction(txBodyBytes);
      return serializeHederaSignature(signature);
    },
    getAddress: async (path: string) => {
      const publicKey = await hedera.getPublicKey(path);

      return {
        path,
        address: publicKey,
        publicKey: publicKey,
      };
    },
  });
};
const signerContextHedera = executeWithSigner(createSignerHedera);

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
    case "hedera": {
      return {
        getAddress: hederaGetAddress(signerContextHedera),
        signTransaction: hederaSignTransaction(signerContextHedera),
        context: signerContextHedera,
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
