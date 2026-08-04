import type { EvmAddress } from "@ledgerhq/live-signer-evm";
import { Signer } from "@ledgerhq/live-common/families/evm/signer";
import { HDNodeWallet, Transaction } from "ethers";
import { mnemonicToSeed } from "bip39";

export const COIN_TESTER_EVM_MNEMONIC =
  "test test test test test test test test test test test junk";

type EvmSigner = Signer & { exportMnemonic: () => string };

function getAddress(wallet: HDNodeWallet): Promise<EvmAddress> {
  return Promise.resolve({ publicKey: wallet.publicKey, address: wallet.address });
}

function signTransaction(wallet: HDNodeWallet, transaction: string): Promise<string> {
  const signature = wallet.signingKey.sign(Transaction.from(transaction).unsignedHash);
  return Promise.resolve(signature.serialized);
}

export async function buildSigner(): Promise<EvmSigner> {
  const seed = await mnemonicToSeed(COIN_TESTER_EVM_MNEMONIC);
  const root = HDNodeWallet.fromSeed(`0x${seed.toString("hex")}`);

  const wallet = (path: string) => root.derivePath(path);

  return {
    exportMnemonic: () => COIN_TESTER_EVM_MNEMONIC,
    getAddress: (path: string) => getAddress(wallet(path)),
    signTransaction: (path: string, transaction: string) =>
      signTransaction(wallet(path), transaction),
  };
}
