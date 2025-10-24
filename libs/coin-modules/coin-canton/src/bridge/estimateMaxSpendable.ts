import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { Transaction, CantonAccount } from "../types";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CantonAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const newTransaction = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || getAbandonSeedAddress("canton_network"),
    amount: new BigNumber(0),
  });
  const status = await getTransactionStatus(mainAccount, newTransaction);
  return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
};
