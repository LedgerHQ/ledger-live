import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import Stellar from "@ledgerhq/hw-app-str";
import { StrKey } from "@stellar/stellar-sdk";
import { CreateSigner, executeWithSigner } from "../../setup";
import Transport from "@ledgerhq/hw-transport";
import { AlpacaSigner } from "./types";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import tezosGetAddress from "@ledgerhq/coin-tezos/signer/getAddress";
import Tezos from "@ledgerhq/hw-app-tezos";
import { context as evmContext, getAddress as evmGetAddress } from "./Eth";
import { context as solanaContext, getAddress as solanaGetAddress } from "./Solana";
import { context as xrpContext, getAddress as xrpGetAddress } from "./Xrp";

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

export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      return {
        getAddress: xrpGetAddress,
        context: xrpContext,
      };
    }
    case "stellar": {
      return {
        getAddress: stellarGetAddress(signerContextStellar),
        context: signerContextStellar,
      };
    }
    case "tezos": {
      return {
        getAddress: tezosGetAddress(signerContextTezos),
        context: signerContextTezos,
      };
    }
    case "evm": {
      return {
        getAddress: evmGetAddress,
        context: evmContext,
      };
    }
    case "solana": {
      return {
        getAddress: solanaGetAddress,
        context: solanaContext,
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
