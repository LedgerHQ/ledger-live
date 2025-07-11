import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { AptosAPI } from "../network";
import { getEstimatedGas } from "./getFeesForTransaction";
import { getMaxSendBalance } from "./logic";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../constants";
import type { AptosAccount, Transaction } from "../types";

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
    const { estimate } = await getEstimatedGas(mainAccount, transaction, aptosClient);

    maxGasAmount = BigNumber(estimate.maxGasAmount);
    gasUnitPrice = BigNumber(estimate.gasUnitPrice);
  }

  return getMaxSendBalance(mainAccount, transaction, maxGasAmount, gasUnitPrice);
};

export default estimateMaxSpendable;
