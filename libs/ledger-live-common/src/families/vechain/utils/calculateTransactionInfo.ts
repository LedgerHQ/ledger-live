import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction, TransactionInfo } from "../types";
import { calculateFee } from "./transaction-utils";

export const calculateTransactionInfo = async (
  account: Account,
  transaction: Transaction
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, useAllAmount, body, subAccountId } = transaction;
  const estimatedFees = await calculateFee(
    BigNumber(body.gas),
    body.gasPriceCoef
  );

  const tokenAccount =
    subAccountId && subAccounts
      ? (subAccounts.find((subAccount) => {
          return subAccount.id === subAccountId;
        }) as TokenAccount)
      : undefined;
  const isTokenAccount = !!tokenAccount;

  let balance;
  let spendableBalance;
  let amount;
  let totalSpent;
  if (isTokenAccount) {
    balance = tokenAccount.balance;
    spendableBalance = tokenAccount.balance.minus(estimatedFees).gt(0)
      ? tokenAccount.balance.minus(estimatedFees)
      : new BigNumber(0);
    amount = useAllAmount ? spendableBalance : oldAmount;
    totalSpent = useAllAmount
      ? tokenAccount.balance
      : BigNumber(amount).plus(estimatedFees);
  } else {
    balance = account.balance;
    spendableBalance = account.balance;
    amount = useAllAmount ? spendableBalance : oldAmount;
    totalSpent = useAllAmount ? account.balance : BigNumber(amount);
  }

  return {
    estimatedFees,
    isTokenAccount,
    amount,
    totalSpent,
    spendableBalance,
    balance,
    tokenAccount,
  };
};
