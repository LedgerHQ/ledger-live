import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import { getMainAccount } from "../../account";
import wallet, { getWalletAccount } from "./wallet-btc";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import type { Account, AccountLike } from "@ledgerhq/types-live";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
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
    transaction ? [transaction.recipient] : []
  );
  return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
};

export default estimateMaxSpendable;
