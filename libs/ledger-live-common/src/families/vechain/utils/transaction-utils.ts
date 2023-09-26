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
import { calculateClausesVtho } from "../js-transaction";

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

export const calculateTransactionInfo = async (
  account: Account,
  transaction: Transaction,
  fixedMaxTokenFees?: BigNumber,
): Promise<TransactionInfo> => {
  const { subAccounts } = account;
  const { amount: oldAmount, useAllAmount, subAccountId } = transaction;
  const maxTokenFees = fixedMaxTokenFees || (await calculateMaxFeesToken(transaction));

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

export const calculateMaxFeesToken = async (transaction: Transaction): Promise<BigNumber> => {
  if (transaction.recipient && isValid(transaction.recipient)) {
    const clauses = await calculateClausesVtho(transaction, transaction.amount);
    const gas = await estimateGas({
      ...transaction,
      body: { ...transaction.body, clauses: clauses },
    });
    return await calculateFee(new BigNumber(gas), DEFAULT_GAS_COEFFICIENT);
  }
  return new BigNumber(0);
};

export const calculateTotalSpent = (isToken: boolean, transaction: Transaction): BigNumber => {
  if (isToken) {
    return transaction.amount.plus(transaction.estimatedFees);
  } else {
    return transaction.amount;
  }
};
