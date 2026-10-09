import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import wallet from "@ledgerhq/wallet-btc/index";
import { getWalletAccount } from "./getWalletAccount";
import type { Transaction } from "./types";
import { getChainAdapter } from "./chain-adapters/registry";
import type { Logger } from "@ledgerhq/coin-module-framework/config";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable = async (
  logger: Logger,
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
): ReturnType<AccountBridge<Transaction>["estimateMaxSpendable"]> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const adapter = getChainAdapter(mainAccount.currency.id);
  const custom = adapter.estimateMaxSpendable?.(mainAccount, parentAccount, transaction);
  if (custom) return custom;

  const walletAccount = getWalletAccount(mainAccount);
  let feePerByte = transaction?.feePerByte;
  if (!feePerByte) {
    const networkInfo = await getAccountNetworkInfo(mainAccount);
    feePerByte = networkInfo.feeItems.defaultFeePerByte;
  }

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    logger,
    walletAccount,
    feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    transaction?.utxoStrategy?.excludeUTXOs || [],
    transaction ? [transaction.recipient] : [],
    transaction?.opReturnData,
  );

  return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
};

export default estimateMaxSpendable;
