import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction, TransactionInfo } from "../types";
import { ImpossibleToCalculateAmountAndFees } from "../errors";
import { calculateGasFees } from "./calculateGasFees";

const getTokenAccount = (
  subAccountId: string | null | undefined,
  subAccounts: TokenAccount[] | undefined,
) =>
  subAccountId && subAccounts
    ? subAccounts.find(subAccount => {
        return subAccount.id === subAccountId;
      })
    : undefined;

// Here there is a circular dependency between values, that is why we need the do-while loop
// dependencies are:
// useAllAmount: USER
// amount: useAllAmount & spendableBalance
// fees: amount
// spendableBalance: fees & balance
// balance: USER
// circular dependency is:
// amount -> spendableBalance -> fees -> amount

export const calculateTransactionInfo = async (
  account: Account,
  transaction: Transaction,
  fixedMaxTokenFees?: {
    estimatedGas: number;
    estimatedGasFees: BigNumber;
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
  },
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, subAccountId, useAllAmount } = transaction;

  const tokenAccount = getTokenAccount(subAccountId, subAccounts);
  const isTokenAccount = !!tokenAccount;

  let amount = oldAmount;
  let amountBackup;
  let tempTransaction = { ...transaction, amount };
  let balance = account.balance;
  let spendableBalance = account.balance;
  let maxEstimatedGasFees = new BigNumber(0);
  let maxEstimatedGas = 0;
  let maxFeePerGas = 0;
  let maxPriorityFeePerGas = 0;

  if (!amount.isNaN()) {
    const MAX_ITERATIONS = 5; // it should never reach more than 2 iterations, but just in case
    let iterations = 0;
    do {
      amountBackup = amount;

      const estimatedGasAndFees =
        fixedMaxTokenFees ||
        (await calculateGasFees(tempTransaction, isTokenAccount, account.freshAddress));

      maxEstimatedGasFees = estimatedGasAndFees.estimatedGasFees;
      maxEstimatedGas = estimatedGasAndFees.estimatedGas;
      maxFeePerGas = estimatedGasAndFees.maxFeePerGas;
      maxPriorityFeePerGas = estimatedGasAndFees.maxPriorityFeePerGas;

      if (isTokenAccount && tokenAccount) {
        balance = tokenAccount.balance;
        spendableBalance = tokenAccount.balance.minus(maxEstimatedGasFees).gt(0)
          ? tokenAccount.balance.minus(maxEstimatedGasFees)
          : new BigNumber(0);
      } else {
        balance = account.balance;
        spendableBalance = account.balance;
      }

      amount = useAllAmount ? spendableBalance : oldAmount;

      tempTransaction = {
        ...tempTransaction,
        amount,
      };
      iterations++;
    } while (!amountBackup.isEqualTo(amount) && iterations < MAX_ITERATIONS);
    if (iterations === MAX_ITERATIONS) {
      throw new ImpossibleToCalculateAmountAndFees();
    }
  }

  return {
    isTokenAccount,
    amount,
    spendableBalance,
    balance,
    tokenAccount,
    estimatedFees: maxEstimatedGasFees.toString(),
    estimatedGas: maxEstimatedGas,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
  };
};
