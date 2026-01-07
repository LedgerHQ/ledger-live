import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { Keypair, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { SolanaAddress, SolanaSignature, SolanaSigner } from "@ledgerhq/coin-solana/signer";

function getAddress(keyPair: Keypair): Promise<SolanaAddress> {
  const address = keyPair.publicKey.toBuffer();
  return Promise.resolve({ address });
}

function signTransaction(keyPair: Keypair, transaction: Buffer): Promise<SolanaSignature> {
  const tx = new VersionedTransaction(VersionedMessage.deserialize(transaction));
  tx.sign([keyPair]);

  const signature = Buffer.from(tx.signatures[0] ?? []);
  return Promise.resolve({ signature });
}

export async function buildSigner(): Promise<SolanaSigner> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = seed.toString("hex");

  const keyPair = (path: string) => Keypair.fromSeed(derivePath(`m/${path}`, seedHex).key);

  return {
    getAddress: (path: string) => getAddress(keyPair(path)),
    signTransaction: (path: string, transaction: Buffer) =>
      signTransaction(keyPair(path), transaction),
    getAppConfiguration: () => {
      throw new Error("Not implemented");
    },
    signMessage: () => {
      throw new Error("Not implemented");
    },
  };
}
