import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import wallet, { getWalletAccount, Account as WalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
import { fromWalletUtxo } from "./synchronisation";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import type { NetworkInfo } from "./types";
import { getMinReplacementFeeRateSatVb, RBF_SEQUENCE_THRESHOLD } from "./rbfFees";
import { Address } from "./wallet-btc/storage/types";
import { scriptToAddress } from "./wallet-btc/utils";

export async function getAmountAndRecipient(
  tx: Transaction,
  walletAccount: WalletAccount,
  knownRecipient?: string,
) {
  const crypto = walletAccount.xpub.crypto;
  // If we already know the recipient from the pending transaction,
  // use it directly to find the correct output
  if (knownRecipient) {
    const recipientOutput = tx.outs.find(out => {
      try {
        const address = scriptToAddress(out.script, crypto);
        return address === knownRecipient;
      } catch {
        return false;
      }
    });

    if (recipientOutput) {
      return { amountSent: recipientOutput.value, recipient: knownRecipient };
    }
  }

  // Fallback: identify external outputs by checking against known wallet addresses
  const allAddressesSet = new Set<string>();

  const receiving = walletAccount.xpub.storage.getUniquesAddresses({ account: 0 });
  receiving.forEach(a => allAddressesSet.add(a.address));

  const change = walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
  change.forEach(a => allAddressesSet.add(a.address));

  const externalOutputs = tx.outs
    .map(out => {
      try {
        const address = scriptToAddress(out.script, crypto);
        return { address, value: out.value };
      } catch {
        return null;
      }
    })
    .filter(
      (o): o is { address: string; value: number } => o !== null && !allAddressesSet.has(o.address),
    );

  const amountSent = externalOutputs.reduce((sum, out) => sum + out.value, 0);
  if (externalOutputs.length === 0) {
    return { amountSent: 0, recipient: "" };
  }
  const recipient = externalOutputs[0].address;

  return { amountSent, recipient };
}

type RbfTxContext = {
  walletAccount: WalletAccount;
  originalTx: Transaction;
  feePerByte: BigNumber;
  networkInfo: NetworkInfo;
  changeAddress: Address;
  excludeUTXOs: Array<{ hash: string; outputIndex: number }>;
};

const assertRbfEnabled = (originalTx: Transaction) => {
  if (!originalTx.ins.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD)) {
    throw new Error("Transaction is not RBF-enabled");
  }
};

const buildExcludeUtxos = async (walletAccount: WalletAccount) => {
  const changeAddrs = new Set(
    walletAccount.xpub.storage.getUniquesAddresses({ account: 1 }).map(a => a.address),
  );

  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const walletUtxos = rawUtxos.map(u => fromWalletUtxo(u, changeAddrs));

  return walletUtxos
    .filter(u => u.blockHeight === null && u.isChange)
    .map(u => ({ hash: u.hash, outputIndex: u.outputIndex }));
};

export const getRbfContext = async (
  account: Account,
  originalTxId: string,
): Promise<RbfTxContext> => {
  const walletAccount = getWalletAccount(account);
  let hexTx: string;
  try {
    hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
  } catch {
    throw new Error(`Original transaction ${originalTxId} could not be fetched`);
  }

  const originalTx = Transaction.fromHex(hexTx);
  assertRbfEnabled(originalTx);

  const minFeeRateSatVb = await getMinReplacementFeeRateSatVb({
    account,
    originalTxId,
  });

  const feePerByte = minFeeRateSatVb.integerValue(BigNumber.ROUND_CEIL);
  const excludeUTXOs = await buildExcludeUtxos(walletAccount);
  const networkInfo = await getAccountNetworkInfo(account);
  const changeAddress = await walletAccount.xpub.getNewAddress(1, 1);

  return {
    walletAccount,
    originalTx,
    feePerByte,
    networkInfo,
    changeAddress,
    excludeUTXOs,
  };
};
