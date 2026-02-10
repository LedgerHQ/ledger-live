import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../constants";
import { AptosAPI } from "../network";
import type { AptosAccount, Transaction } from "../types";
import { getEstimatedGas } from "./getFeesForTransaction";
import { getMaxSendBalance } from "./logic";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike<AptosAccount>;
  parentAccount?: AptosAccount;
  transaction?: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);

  const aptosClient = new AptosAPI(mainAccount.currency.id);

  let maxGasAmount = new BigNumber(DEFAULT_GAS);
  let gasUnitPrice = new BigNumber(DEFAULT_GAS_PRICE);

  if (transaction) {
    const amount = transaction.amount.isZero() ? account.spendableBalance : transaction.amount;
    const { estimate } = await getEstimatedGas(
      mainAccount,
      { ...transaction, amount },
      aptosClient,
    );

    maxGasAmount = BigNumber(estimate.maxGasAmount);
    gasUnitPrice = BigNumber(estimate.gasUnitPrice);
  }

  return getMaxSendBalance(account, parentAccount, maxGasAmount, gasUnitPrice);
};

export default estimateMaxSpendable;
