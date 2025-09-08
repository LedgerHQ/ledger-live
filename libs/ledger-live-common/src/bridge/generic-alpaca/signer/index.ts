import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import hederaGetAddress from "@ledgerhq/coin-hedera/signer/getAddress";
import {
  deserializeTransaction as deserializeHederaTransaction,
  serializeSignature as serializeHederaSignature,
} from "@ledgerhq/coin-hedera/logic/utils";
import { getHederaTransactionBodyBytes } from "@ledgerhq/coin-hedera/logic/utils";
import Stellar from "@ledgerhq/hw-app-str";
import {
  signTransaction,
  stellarSignTransaction,
  tezosSignTransaction,
  hederaSignTransaction,
} from "./signTransaction";
import { StrKey } from "@stellar/stellar-sdk";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import { AlpacaSigner } from "./types";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import tezosGetAddress from "@ledgerhq/coin-tezos/signer/getAddress";
import Tezos from "@ledgerhq/hw-app-tezos";

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

const createSignerTezos: CreateSigner<
  Tezos & { createLedgerSigner: (path: string, prompt: boolean, derivationType: number) => any }
> = (transport: Transport) => {
  const tezos = new Tezos(transport);
  // align with genericSignOperation that calls signer.signTransaction
  return Object.assign(tezos, {
    async signTransaction(path: string, rawTxHex: string) {
      const { signature } = await tezos.signOperation(path, rawTxHex, {});
      return signature;
    },
    async getAddress(path: string, { verify }: { verify?: boolean } = {}) {
      // Use Taquito LedgerSigner to retrieve base58 public key and matching pkh (like oldbridge)
      const ledgerSigner = new TaquitoLedgerSigner(
        transport,
        path,
        !!verify,
        DerivationType.ED25519,
      );
      const address = await ledgerSigner.publicKeyHash();
      const publicKey = await ledgerSigner.publicKey();
      return { path, address, publicKey };
    },
    createLedgerSigner(path: string, prompt: boolean, derivationType: number) {
      // Map 0 -> ED25519, 1 -> SECP256K1, 2 -> P256 by convention
      let dt: DerivationType = DerivationType.ED25519;
      if (derivationType === 1) dt = DerivationType.SECP256K1;
      else if (derivationType === 2) dt = DerivationType.P256;
      return new TaquitoLedgerSigner(transport, path, prompt, dt);
    },
  });
};

const signerContextTezos = executeWithSigner(createSignerTezos);

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
    case "tezos": {
      return {
        getAddress: tezosGetAddress(signerContextTezos),
        signTransaction: tezosSignTransaction(executeWithSigner(createSignerTezos)),
        context: signerContextTezos,
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
