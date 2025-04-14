import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "../api";
import { getEstimatedGas } from "./getFeesForTransaction";
import type { Transaction } from "../types";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, getMaxSendBalance } from "./logic";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  if (transaction.stake) {
    transaction.recipient = transaction.stake.poolAddr;
  }

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

  if (transaction.useAllAmount) {
    // we will use this amount in simulation, to estimate gas
    transaction.amount = getMaxSendBalance(
      new BigNumber(DEFAULT_GAS),
      new BigNumber(DEFAULT_GAS_PRICE),
      account,
      transaction,
    );
  }

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  if (transaction.useAllAmount) {
    // correct the transaction amount according to estimated fees
    transaction.amount = getMaxSendBalance(
      BigNumber(estimate.maxGasAmount),
      BigNumber(estimate.gasUnitPrice),
      account,
      transaction,
    );
  }

  transaction.fees = fees;
  transaction.options = estimate;
  transaction.errors = errors;

  return transaction;
};

export default prepareTransaction;
