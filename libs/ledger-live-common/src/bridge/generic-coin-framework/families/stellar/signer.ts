import resolver from "../../../../families/stellar/getAddress";
import { CreateSigner, executeWithSigner } from "../../../setup";
import type { CoinFrameworkSigner } from "../../types";
import Transport from "@ledgerhq/hw-transport";
import Stellar from "@ledgerhq/hw-app-str";
import { StrKey } from "@stellar/stellar-sdk";

type StellarSigner = Stellar & {
  signTransaction: (path: string, transaction: string) => Promise<string>;
  getAddress: (
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ path: string; address: string; publicKey: string }>;
};

export const createSignerStellar: CreateSigner<StellarSigner> = (transport: Transport) => {
  const stellar = new Stellar(transport);
  const originalSignTransaction = stellar.signTransaction;
  return Object.assign(stellar, {
    signTransaction: async (path: string, transaction: string) => {
      const unsignedPayload: Buffer = Buffer.from(transaction, "base64");
      const { signature } = await originalSignTransaction(path, unsignedPayload);
      return signature.toString("base64");
    },
    getAddress: async (path: string, options?: boolean | { verify?: boolean }) => {
      const verify = typeof options === "boolean" ? options : options?.verify;
      const { rawPublicKey } = await stellar.getPublicKey(path, !!verify);
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
      return {
        path,
        address: publicKey,
        publicKey: publicKey,
      };
    },
  });
};

export const context = executeWithSigner(createSignerStellar);

export default {
  context,
  getAddress: resolver(context),
} satisfies CoinFrameworkSigner;
