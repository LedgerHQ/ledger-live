import { DEFAULT_GAS_COEFFICIENT, HEX_PREFIX } from "../constants";
import crypto from "crypto";
import BigNumber from "bignumber.js";
import { Transaction as ThorTransaction } from "thor-devkit";
import params from "../contracts/abis/params";
import { BASE_GAS_PRICE_KEY, PARAMS_ADDRESS } from "../contracts/constants";
import { Query } from "../api/types";
import { query } from "../api/sdk";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction, TransactionInfo } from "../types";
import { isValid } from "./address-utils";
import { calculateClausesVet, calculateClausesVtho } from "../js-transaction";
import { ImpossibleToCalculateAmountAndFees } from "../errors";

const GAS_COEFFICIENT = 15000;

/**
 * Generate a Unique ID to be used as a nonce
 * @returns a unique string
 */
export const generateNonce = (): string => {
  const randBuffer = crypto.randomBytes(Math.ceil(4));
  if (!randBuffer) throw Error("Failed to generate random hex");
  return `${HEX_PREFIX}${randBuffer.toString("hex").substring(0, 8)}`;
};

/**
 * Estimate the gas that will be used by the transaction.
 * @param transaction - The transaction to estimate the gas for
 * @returns an estimate of the gas usage
 */
export const estimateGas = async (t: Transaction): Promise<number> => {
  const intrinsicGas = ThorTransaction.intrinsicGas(t.body.clauses);

  const queryData: Query[] = [];

  t.body.clauses.forEach(c => {
    if (c.to) {
      queryData.push({
        to: c.to,
        data: c.data,
      });
    }
  });

  const response = await query(queryData);

  const execGas = response.reduce((sum, out) => sum + out.gasUsed, 0);

  return intrinsicGas + (execGas ? execGas + GAS_COEFFICIENT : 0);
};

const getBaseGasPrice = async (): Promise<string> => {
  const queryData: Query = {
    to: PARAMS_ADDRESS,
    data: params.get.encode(BASE_GAS_PRICE_KEY),
  };

  const response = await query([queryData]);

  // Expect 1 value
  if (response && response.length != 1) throw Error("Unexpected response received for query");

  return response[0].data;
};

/**
 * Calculate the fee in VTHO
 * @param gas - the gas used
 * @param gasPriceCoef - the gas price coefficient
 * @returns the fee in VTHO
 */
export const calculateFee = async (gas: BigNumber, gasPriceCoef: number): Promise<BigNumber> => {
  const baseGasPrice = await getBaseGasPrice();
  return new BigNumber(baseGasPrice).times(gasPriceCoef).idiv(255).plus(baseGasPrice).times(gas);
};

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
  },
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, subAccountId, useAllAmount } = transaction;

  const tokenAccount =
    subAccountId && subAccounts
      ? (subAccounts.find(subAccount => {
          return subAccount.id === subAccountId;
        }) as TokenAccount)
      : undefined;
  const isTokenAccount = !!tokenAccount;

  let amount = oldAmount;
  let amountBackup;
  let tempTransaction = { ...transaction, amount };
  let balance = account.balance;
  let spendableBalance = account.balance;
  let maxEstimatedGasFees = new BigNumber(0);
  let maxEstimatedGas = 0;

  if (!amount.isNaN()) {
    const MAX_ITERATIONS = 5; // it should never reach more than 2 iterations, but just in case
    let iterations = 0;
    do {
      amountBackup = amount;

      const estimatedGasAndFees =
        fixedMaxTokenFees || (await calculateGasFees(tempTransaction, isTokenAccount));

      maxEstimatedGasFees = estimatedGasAndFees.estimatedGasFees;
      maxEstimatedGas = estimatedGasAndFees.estimatedGas;

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
  };
};

export const calculateGasFees = async (
  transaction: Transaction,
  isTokenAccount: boolean,
): Promise<{
  estimatedGas: number;
  estimatedGasFees: BigNumber;
}> => {
  if (transaction.recipient && isValid(transaction.recipient)) {
    let clauses;
    if (isTokenAccount) {
      clauses = await calculateClausesVtho(transaction.recipient, transaction.amount);
    } else {
      clauses = await calculateClausesVet(transaction.recipient, transaction.amount);
    }
    const gas = await estimateGas({
      ...transaction,
      body: { ...transaction.body, clauses: clauses },
    });
    return {
      estimatedGas: gas,
      estimatedGasFees: await calculateFee(
        new BigNumber(gas),
        transaction.body.gasPriceCoef || DEFAULT_GAS_COEFFICIENT,
      ),
    };
  }
  return {
    estimatedGas: 0,
    estimatedGasFees: new BigNumber(0),
  };
};
