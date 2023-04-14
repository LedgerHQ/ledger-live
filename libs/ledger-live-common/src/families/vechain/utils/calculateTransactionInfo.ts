import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction, TransactionInfo } from "../types";
import { calculateFee, estimateGas } from "./transaction-utils";
import { isValid } from "./address-utils";
import { calculateClausesVtho } from "../js-transaction";

export const calculateTransactionInfo = async (
  account: Account,
  transaction: Transaction
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, useAllAmount, subAccountId } = transaction;
  const maxTokenFees = await calculateMaxFeesToken(account, transaction);

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

  if (isTokenAccount) {
    balance = tokenAccount.balance;
    spendableBalance = tokenAccount.balance.minus(maxTokenFees).gt(0)
      ? tokenAccount.balance.minus(maxTokenFees)
      : new BigNumber(0);
    amount = useAllAmount ? spendableBalance : oldAmount;
  } else {
    balance = account.balance;
    spendableBalance = account.balance;
    amount = useAllAmount ? spendableBalance : oldAmount;
  }

  return {
    isTokenAccount,
    amount,
    spendableBalance,
    balance,
    tokenAccount,
  };
};

export const calculateMaxFeesToken = async (
  account: Account,
  transaction: Transaction
): Promise<BigNumber> => {
  if (
    transaction.subAccountId &&
    transaction.recipient &&
    isValid(transaction.recipient) &&
    account?.subAccounts?.[0]
  ) {
    const clauses = await calculateClausesVtho(
      transaction,
      account.subAccounts[0].balance
    );
    const gas = await estimateGas({
      ...transaction,
      body: { ...transaction.body, clauses: clauses },
    });
    const estimatedFees = await calculateFee(
      new BigNumber(gas),
      transaction.body.gasPriceCoef
    );
    return estimatedFees;
  }
  return new BigNumber(0);
};

export const calculateTotalSpent = (
  isToken: boolean,
  transaction: Transaction
): BigNumber => {
  if (isToken) {
    return transaction.amount.plus(transaction.estimatedFees);
  } else {
    return transaction.amount;
  }
};
