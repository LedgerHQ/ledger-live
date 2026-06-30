import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Transaction } from "../types";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const newTransaction = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    // fee estimation might require a recipient to work, in that case, we use a dummy one
    recipient: transaction?.recipient || CONCORDIUM_DUMMY_ADDRESS,
    amount: new BigNumber(0),
  });
  const status = await getTransactionStatus(mainAccount, newTransaction);
  return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
};
