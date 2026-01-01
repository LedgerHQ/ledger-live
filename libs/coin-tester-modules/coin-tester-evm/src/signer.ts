import { EvmAddress } from "@ledgerhq/coin-evm/types/signer";
import { Signer } from "@ledgerhq/live-common/bridge/generic-alpaca/signer/Eth";
import { HDNodeWallet, Transaction } from "ethers";
import { generateMnemonic, mnemonicToSeed } from "bip39";

type EvmSigner = Signer & { exportMnemonic: () => string };

function getAddress(wallet: HDNodeWallet): Promise<EvmAddress> {
  return Promise.resolve({ publicKey: wallet.publicKey, address: wallet.address });
}

function signTransaction(wallet: HDNodeWallet, transaction: string): Promise<string> {
  const signature = wallet.signingKey.sign(Transaction.from(transaction).unsignedHash);
  return Promise.resolve(signature.serialized);
}

export async function buildSigner(): Promise<EvmSigner> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = seed.toString("hex");
  const root = HDNodeWallet.fromSeed(`0x${seedHex}`);

  const wallet = (path: string) => root.derivePath(path);

  return {
    exportMnemonic: () => mnemonic,
    getAddress: (path: string) => getAddress(wallet(path)),
    signTransaction: (path: string, transaction: string) =>
      signTransaction(wallet(path), transaction),
  };
}
