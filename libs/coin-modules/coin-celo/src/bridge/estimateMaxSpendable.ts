import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CeloAccount, Transaction } from "../types";
import createTransaction from "./createTransaction";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CeloAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    useAllAmount: true,
  });

  const { amount } = await getTransactionStatus(mainAccount, t);

  // getTransactionStatus already handles fee subtraction when useAllAmount is true
  // and returns the correct amount for both token and native CELO transfers
  return BigNumber.max(0, amount);
};

export default estimateMaxSpendable;
