import type { Account } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import BigNumber from "bignumber.js";
import { AptosAPI } from "../api";
import { getEstimatedGas } from "./getFeesForTransaction";
import type { Transaction } from "../types";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, getMaxSendBalance } from "./logic";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  if (!transaction.recipient) {
    return transaction;
  }

  // if transaction.useAllAmount is true, then we expect transaction.amount to be 0
  // so to check that actual amount is zero or not, we also need to check if useAllAmount is false
  if (transaction.amount.isZero() && !transaction.useAllAmount) {
    return {
      ...transaction,
      fees: BigNumber(0),
    };
  }

  const aptosClient = new AptosAPI(account.currency.id);

  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);

  if (transaction.useAllAmount) {
    // we will use this amount in simulation, to estimate gas
    transaction.amount = getMaxSendBalance(
      fromTokenAccount ? tokenAccount.spendableBalance : account.spendableBalance,
      new BigNumber(DEFAULT_GAS),
      new BigNumber(DEFAULT_GAS_PRICE),
    );
  }

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  if (transaction.useAllAmount) {
    // correct the transaction amount according to estimated fees
    transaction.amount = getMaxSendBalance(
      fromTokenAccount ? tokenAccount.spendableBalance : account.spendableBalance,
      BigNumber(estimate.maxGasAmount),
      BigNumber(estimate.gasUnitPrice),
    );
  }

  transaction.fees = fees;
  transaction.options = estimate;
  transaction.errors = errors;

  return transaction;
};

export default prepareTransaction;
