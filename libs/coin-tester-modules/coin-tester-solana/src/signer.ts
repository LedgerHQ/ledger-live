import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import type { SolanaSigner as CoinFrameworkSolanaSigner } from "@ledgerhq/live-common/families/solana/signer";

export type Signers = {
  coinframework: CoinFrameworkSolanaSigner;
};

export async function buildSigners(): Promise<Signers> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = seed.toString("hex");

  const keyPair = (path: string) => Keypair.fromSeed(derivePath(`m/${path}`, seedHex).key);

  const coinframework: CoinFrameworkSolanaSigner = {
    getAddress: async (path: string) => {
      const { publicKey } = keyPair(path);
      return { address: publicKey.toBuffer(), publicKey: publicKey.toBase58() };
    },
    signTransaction: async (path: string, txBase64: string) => {
      const kp = keyPair(path);
      const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
      tx.sign([kp]);
      return Buffer.from(tx.signatures[0] ?? []).toString("hex");
    },
  };

  return { coinframework };
}
