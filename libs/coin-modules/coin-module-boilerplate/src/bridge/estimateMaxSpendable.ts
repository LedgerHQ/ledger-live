import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { BoilerplateContext } from "../config";
import { DUMMY_RECIPIENT } from "../constants";
import { Transaction } from "../types";
import { createTransaction } from "./createTransaction";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { buildPrepareTransaction } from "./prepareTransaction";

export const buildEstimateMaxSpendable = (
  context: BoilerplateContext,
): AccountBridge<Transaction>["estimateMaxSpendable"] => {
  const prepareTransaction = buildPrepareTransaction(context);
  const getTransactionStatus = buildGetTransactionStatus(context);

  return async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount);
    const newTransaction = await prepareTransaction(mainAccount, {
      ...createTransaction(account),
      ...transaction,
      // fee estimation might require a recipient to work, in that case, we use a dummy one
      recipient: transaction?.recipient || DUMMY_RECIPIENT,
      amount: new BigNumber(0),
    });
    const status = await getTransactionStatus(mainAccount, newTransaction);
    return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
  };
};
