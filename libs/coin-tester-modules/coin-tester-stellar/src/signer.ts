import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "crypto";
import { StrKey } from "@stellar/stellar-sdk";

export type StellarSigner = {
  getPublicKey(path: string, display?: boolean): Promise<{ rawPublicKey: Buffer }>;
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    transaction: string,
    options?: { derivationMode?: string },
  ): Promise<string>;
};

export async function buildSigner(): Promise<StellarSigner> {
  const privateKey = Uint8Array.from(randomBytes(32));
  const rawPublicKey = Buffer.from(ed25519.getPublicKey(privateKey));

  const address = StrKey.encodeEd25519PublicKey(rawPublicKey);

  return {
    getPublicKey: async (_path: string, _display?: boolean) => ({ rawPublicKey }),
    getAddress: async (path: string, _options?: { verify?: boolean; derivationMode?: string }) => ({
      path,
      address,
      publicKey: address,
    }),
    signTransaction: async (
      _path: string,
      transaction: string,
      _options?: { derivationMode?: string },
    ) => {
      const payload = Buffer.from(transaction, "base64");
      const hash = sha256(payload);
      const signature = ed25519.sign(hash, privateKey);
      return Buffer.from(signature).toString("base64");
    },
  };
}
