import invariant from "invariant";
import { AccountBridge } from "@ledgerhq/types-live";
import type { Account } from "@ledgerhq/types-live";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import type { BitcoinAccount, Transaction } from "./types";
import { inferFeePerByte } from "./logic";
import { getWalletAccount } from "./wallet-btc";
/**
 * Build a list of UTXOs to exclude because their transactions can't be fetched.
 * This includes UTXOs from pending operations that were replaced, and any other
 * UTXOs whose parent transactions are no longer available.
 */
async function getExcludeUTXOsFromUnfetchable(
  account: Account,
): Promise<Array<{ hash: string; outputIndex: number }>> {
  const walletAccount = getWalletAccount(account as BitcoinAccount);
  const excludeUTXOs: Array<{ hash: string; outputIndex: number }> = [];

  // Get all UTXOs
  const bitcoinAccount = account as BitcoinAccount;
  const bitcoinResources = bitcoinAccount.bitcoinResources;
  if (!bitcoinResources?.utxos) {
    return excludeUTXOs;
  }

  // Group UTXOs by transaction hash
  const txHashToUtxos = new Map<string, Array<{ hash: string; outputIndex: number }>>();
  for (const utxo of bitcoinResources.utxos) {
    if (!txHashToUtxos.has(utxo.hash)) {
      txHashToUtxos.set(utxo.hash, []);
    }
    txHashToUtxos.get(utxo.hash)!.push({ hash: utxo.hash, outputIndex: utxo.outputIndex });
  }

  // Check each unique transaction
  const uniqueTxHashes = Array.from(txHashToUtxos.keys());
  const results = await Promise.allSettled(
    uniqueTxHashes.map(hash => walletAccount.xpub.explorer.getTxHex(hash)),
  );

  // Exclude UTXOs from unfetchable transactions
  results.forEach((res, index) => {
    const txHash = uniqueTxHashes[index];
    if (res.status === "rejected") {
      const utxosFromTx = txHashToUtxos.get(txHash)!;
      excludeUTXOs.push(...utxosFromTx);
    }
  });

  return excludeUTXOs;
}

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  let networkInfo = transaction.networkInfo;

  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(account);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }

  const feePerByte = inferFeePerByte(transaction, networkInfo);

  // Auto-populate excludeUTXOs from UTXOs whose transactions can't be fetched
  // This ensures stale/replaced UTXOs are not used
  const autoExcludeUTXOs = await getExcludeUTXOsFromUnfetchable(account);
  const currentExclusions = transaction.utxoStrategy?.excludeUTXOs || [];

  // Merge auto-excluded with user-excluded (avoid duplicates)
  const mergedExclusions = [...currentExclusions];
  for (const utxo of autoExcludeUTXOs) {
    if (
      !mergedExclusions.some(ex => ex.hash === utxo.hash && ex.outputIndex === utxo.outputIndex)
    ) {
      mergedExclusions.push(utxo);
    }
  }

  if (
    transaction.networkInfo === networkInfo &&
    (feePerByte === transaction.feePerByte || feePerByte.eq(transaction.feePerByte || 0)) &&
    transaction.utxoStrategy?.excludeUTXOs?.length === mergedExclusions.length
  ) {
    // nothing changed
    return transaction;
  }
  // if fees strategy is custom, we don't want to change the feePerByte but we still want to update the networkInfo
  if (transaction.feesStrategy === "custom") {
    return {
      ...transaction,
      networkInfo,
      utxoStrategy: {
        ...transaction.utxoStrategy,
        excludeUTXOs: mergedExclusions,
      },
    };
  }

  return {
    ...transaction,
    networkInfo,
    feePerByte,
    utxoStrategy: {
      ...transaction.utxoStrategy,
      excludeUTXOs: mergedExclusions,
    },
  };
};

export default prepareTransaction;
