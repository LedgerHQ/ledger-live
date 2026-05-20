import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { Keypair, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import type { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import type { SolanaSigner as CoinFrameworkSolanaSigner } from "@ledgerhq/live-common/bridge/generic-coin-framework/families/solana/signer";

export type Signers = {
  coinframework: CoinFrameworkSolanaSigner;
  bridge: SolanaSigner;
};

export async function buildSigners(): Promise<Signers> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = seed.toString("hex");

  const keyPair = (path: string) => Keypair.fromSeed(derivePath(`m/${path}`, seedHex).key);

  const bridge: SolanaSigner = {
    getAppConfiguration: () => {
      throw new Error("Not implemented");
    },
    getAddress: async (path: string) => ({
      address: keyPair(path).publicKey.toBuffer(),
    }),
    signTransaction: async (path: string, txBuffer: Buffer) => {
      const kp = keyPair(path);
      const message = VersionedMessage.deserialize(txBuffer);
      const tx = new VersionedTransaction(message);
      tx.sign([kp]);
      return { signature: Buffer.from(tx.signatures[0] ?? []) };
    },
    signMessage: () => {
      throw new Error("Not implemented");
    },
  };

  const coinframework: CoinFrameworkSolanaSigner = {
    getAddress: async (path: string) => ({
      address: keyPair(path).publicKey.toBuffer(),
    }),
    signTransaction: async (path: string, txBase64: string) => {
      const kp = keyPair(path);
      const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
      tx.sign([kp]);
      return Buffer.from(tx.signatures[0] ?? []).toString("hex");
    },
  };

  return { coinframework, bridge };
}
