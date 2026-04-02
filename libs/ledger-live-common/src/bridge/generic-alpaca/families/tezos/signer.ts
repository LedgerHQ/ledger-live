import Tezos from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import type { AlpacaSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";
import resolver from "../../../../families/tezos/getAddress";

const createSignerTezos: CreateSigner<
  Tezos & {
    createLedgerSigner: (
      path: string,
      prompt: boolean,
      derivationType: number,
    ) => TaquitoLedgerSigner;
  }
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

export const context = executeWithSigner(createSignerTezos);

export default {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
