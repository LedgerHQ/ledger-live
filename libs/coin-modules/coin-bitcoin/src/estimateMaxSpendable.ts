import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import wallet, { getWalletAccount } from "./wallet-btc";
import type { Transaction } from "./types";
import { getChainAdapter } from "./chain-adapters/registry";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
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
    walletAccount,
    feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    transaction?.utxoStrategy?.excludeUTXOs || [],
    transaction ? [transaction.recipient] : [],
    transaction?.opReturnData,
  );

  return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
};

export default estimateMaxSpendable;
