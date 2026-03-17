import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { Signer } from "@ledgerhq/live-common/bridge/generic-alpaca/signer/Solana";

export async function buildSigner(): Promise<Signer> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = seed.toString("hex");

  const keyPair = (path: string) => Keypair.fromSeed(derivePath(`m/${path}`, seedHex).key);

  return {
    getAddress: async (path: string) => {
      const kp = keyPair(path);
      const address = kp.publicKey.toBuffer();
      const publicKey = bs58.encode(address);
      return { address, publicKey };
    },
    signTransaction: async (path: string, txBase64: string) => {
      const kp = keyPair(path);
      const txBuffer = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBuffer);
      tx.sign([kp]);
      const signature = Buffer.from(tx.signatures[0] ?? []);
      return signature.toString("hex");
    },
  };
}
