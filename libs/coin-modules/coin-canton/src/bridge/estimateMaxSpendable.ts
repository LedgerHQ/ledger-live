import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CANTON_UNSET_RECIPIENT } from "../constants";
import { Transaction, CantonAccount } from "../types";
import { createTransaction } from "./createTransaction";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CantonAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const newTransaction = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || CANTON_UNSET_RECIPIENT,
    amount: new BigNumber(0),
  });
  const status = await getTransactionStatus(mainAccount, newTransaction);
  return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
};
