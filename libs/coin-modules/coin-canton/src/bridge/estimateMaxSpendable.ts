import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import { CANTON_UNSET_RECIPIENT } from "../constants";
import { Transaction, CantonAccount } from "../types";
import { createTransaction } from "./createTransaction";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";

export const estimateMaxSpendable = async (
  context: CantonContext,
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction, CantonAccount>["estimateMaxSpendable"]>[0],
): Promise<BigNumber> => {
  // The parent account pays a token's fee in CC.
  if (account.type === "TokenAccount") return account.spendableBalance;

  const mainAccount = getMainAccount(account, parentAccount);
  const newTransaction = await prepareTransaction(context, mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || CANTON_UNSET_RECIPIENT,
    amount: new BigNumber(0),
  });
  const status = await getTransactionStatus(context, mainAccount, newTransaction);
  return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
};
