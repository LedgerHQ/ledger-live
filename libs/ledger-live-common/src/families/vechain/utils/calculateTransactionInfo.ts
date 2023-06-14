import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction, TransactionInfo } from "../types";
import { calculateFee } from "../utils/transaction-utils";
import { DEFAULT_GAS_COEFFICIENT } from "../constants";
// import { calculateFee, estimateGas } from "./transaction-utils";
// import { isValid } from "./address-utils";
// import { calculateClausesVtho } from "../js-transaction";

export const calculateTransactionInfo = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, useAllAmount, subAccountId } = transaction;
  const maxTokenFees = await calculateMaxFeesToken();

  const tokenAccount =
    subAccountId && subAccounts
      ? (subAccounts.find(subAccount => {
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

export const calculateMaxFeesToken = async (): Promise<BigNumber> => {
  //FIXME: The BE call is currently returning not stable values, hardwiring a value
  // account: AccountLike,
  // transaction: Transaction

  // const accountTmp =
  //   account.type === "Account" ? account?.subAccounts?.[0] : account;

  // if (
  //   transaction.subAccountId &&
  //   transaction.recipient &&
  //   isValid(transaction.recipient) &&
  //   accountTmp
  // ) {
  //   transaction.amount = new BigNumber("1500000000000000");
  //   const clauses = await calculateClausesVtho(
  //     transaction,
  //     new BigNumber("1500000000000000")
  //   );
  //   console.warn(transaction);
  //   const gas = await estimateGas({
  //     ...transaction,
  //     body: { ...transaction.body, clauses: clauses },
  //   });
  //   const estimatedFees = new BigNumber(gas);
  //   return estimatedFees;
  // }
  const fees = calculateFee(new BigNumber("67000"), DEFAULT_GAS_COEFFICIENT);
  return fees;
};

export const calculateTotalSpent = (isToken: boolean, transaction: Transaction): BigNumber => {
  if (isToken) {
    return transaction.amount.plus(transaction.estimatedFees);
  } else {
    return transaction.amount;
  }
};
