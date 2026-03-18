import { CreateSigner, executeWithSigner } from "../setup";
import Transport from "@ledgerhq/hw-transport";
import type { AlpacaSigner } from "./types";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import tezosGetAddress from "@ledgerhq/coin-tezos/signer/getAddress";
import Tezos from "@ledgerhq/hw-app-tezos";
import evmSigner from "./families/evm/signer";
import xrpSigner from "./families/xrp/signer";
import stellarSigner from "./families/stellar/signer";

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
      return xrpSigner;
    }
    case "stellar": {
      return stellarSigner;
    }
    case "tezos": {
      return {
        getAddress: tezosGetAddress(signerContextTezos),
        context: signerContextTezos,
      };
    }
    case "evm": {
      return evmSigner;
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
