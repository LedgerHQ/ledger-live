import type { AccountBridge } from "@ledgerhq/types-live";
import { CeloAccount, Transaction } from "../types";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";
import createTransaction from "./createTransaction";
import {
  findSubAccountById,
  getMainAccount,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/helpers";
import BigNumber from "bignumber.js";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CeloAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const tokenAccount = findSubAccountById(mainAccount, transaction?.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);

  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    useAllAmount: true,
  });

  const { amount } = await getTransactionStatus(mainAccount, t);
  const fees = t.fees ?? BigNumber(0);

  return fromTokenAccount
    ? tokenAccount.spendableBalance
    : account.spendableBalance.gt(fees)
      ? amount.minus(fees)
      : new BigNumber(0);
};

export default estimateMaxSpendable;
