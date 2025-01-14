import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getEstimatedGas } from "./getEstimatedGas";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, getMaxSendBalance } from "../logic";
import type { Transaction } from "../../types";
import { node } from "../../network";

type EstimateMaxSpendable = {
  account: Account;
  parentAccount: Account;
  transaction: Transaction;
};

export async function estimateMaxSpendable({
  account,
  parentAccount,
  transaction,
}: EstimateMaxSpendable): Promise<BigNumber> {
  const mainAccount = getMainAccount(account, parentAccount);

  const client = await node();

  let maxGasAmount = new BigNumber(DEFAULT_GAS);
  let gasUnitPrice = new BigNumber(DEFAULT_GAS_PRICE);

  if (transaction) {
    const { estimate } = await getEstimatedGas(mainAccount, transaction, client);

    maxGasAmount = BigNumber(estimate.maxGasAmount);
    gasUnitPrice = BigNumber(estimate.gasUnitPrice);
  }

  return getMaxSendBalance(mainAccount.spendableBalance, maxGasAmount, gasUnitPrice);
}
