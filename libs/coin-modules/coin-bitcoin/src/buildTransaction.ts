import {
  CoinSelect,
  DeepFirst,
  Merge,
  type Account as WalletAccount,
  type TransactionInfo as WalletTxInfo,
} from "./wallet-btc";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";

import type { Transaction, UtxoStrategy, BtcOperationExtra } from "./types";
import { bitcoinPickingStrategy } from "./types";
import wallet, { getWalletAccount } from "./wallet-btc";
import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";

const isBtcOperationExtra = (extra: unknown): extra is BtcOperationExtra => {
  if (extra === null || extra === undefined || typeof extra !== "object") return false;
  if (!("inputs" in extra)) return true;
  return extra.inputs === undefined || Array.isArray(extra.inputs);
};

const selectUtxoPickingStrategy = (walletAccount: WalletAccount, utxoStrategy: UtxoStrategy) => {
  const handler = {
    [bitcoinPickingStrategy.MERGE_OUTPUTS]: Merge,
    [bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST]: DeepFirst,
    [bitcoinPickingStrategy.OPTIMIZE_SIZE]: CoinSelect,
  }[utxoStrategy.strategy];
  if (!handler) throw new Error("Unsupported Bitcoin UTXO picking strategy");

  return new handler(
    walletAccount.xpub.crypto,
    walletAccount.xpub.derivationMode,
    utxoStrategy.excludeUTXOs,
  );
};

export const buildTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<WalletTxInfo> => {
  const { feePerByte, recipient, opReturnData, utxoStrategy, changeAddress } = transaction;

  if (!feePerByte) {
    throw new FeeNotLoaded();
  }

  const walletAccount = getWalletAccount(account);
  const utxoPickingStrategy = selectUtxoPickingStrategy(walletAccount, transaction.utxoStrategy);

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    walletAccount,
    feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    utxoStrategy.excludeUTXOs,
    [recipient],
    opReturnData,
  );

  log("btcwallet", "building transaction", transaction);

  const mainAccount = transaction.replaceTxId ? getMainAccount(account, undefined) : undefined;
  let pendingOperations = mainAccount?.pendingOperations?.map(op => {
    const extra = isBtcOperationExtra(op.extra) ? op.extra : undefined;
    return extra !== undefined && extra !== null ? { hash: op.hash, extra } : { hash: op.hash };
  });

  if (transaction.replaceTxId) {
    try {
      const explorerPendings = await wallet.getAccountPendings(walletAccount);
      const explorerPendingOperations = explorerPendings.map(tx => ({
        hash: tx.id,
        extra: {
          inputs: tx.inputs.map(input => `${input.output_hash}-${input.output_index}`),
        },
      }));

      const byHash = new Map((pendingOperations || []).map(op => [op.hash, op] as const));

      for (const op of explorerPendingOperations) {
        const existing = byHash.get(op.hash);
        if (!existing) {
          byHash.set(op.hash, op);
          continue;
        }
        const existingInputs = existing.extra?.inputs;
        if (!Array.isArray(existingInputs) || existingInputs.length === 0) {
          byHash.set(op.hash, { ...existing, extra: op.extra });
        }
      }
      pendingOperations = [...byHash.values()];
    } catch (error) {
      // Ignore explorer pending enrichment errors and fallback to account pending operations only.
      log("btcwallet", "pending enrichment fallback", { error });
    }
  }

  const txInfo = await wallet.buildAccountTx({
    fromAccount: walletAccount,
    dest: transaction.recipient,
    amount: transaction.useAllAmount ? maxSpendable : transaction.amount,
    feePerByte: feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    utxoPickingStrategy,
    // Definition of replaceable, per the standard: https://github.com/bitcoin/bips/blob/61ccc84930051e5b4a99926510d0db4a8475a4e6/bip-0125.mediawiki#summary
    sequence: transaction.rbf ? 0 : 0xffffffff,
    opReturnData,
    changeAddress,
    ...(transaction?.replaceTxId !== undefined ? { originalTxId: transaction.replaceTxId } : {}),
    pendingOperations,
  });
  log("btcwallet", "txInfo", txInfo);

  return txInfo;
};
