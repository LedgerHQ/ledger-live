import resolver from "../../../../families/stellar/getAddress";
import { CreateSigner, executeWithSigner } from "../../../setup";
import type { AlpacaSigner } from "../../types";
import Transport from "@ledgerhq/hw-transport";
import Stellar from "@ledgerhq/hw-app-str";
import { StrKey } from "@stellar/stellar-sdk";

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

export const context = executeWithSigner(createSignerStellar);

export default {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
