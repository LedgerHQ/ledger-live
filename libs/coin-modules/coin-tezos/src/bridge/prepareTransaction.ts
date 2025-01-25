import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { TezosAccount, Transaction } from "../types";
import { validateRecipient } from "../logic";
import getEstimatedFees from "./getFeesForTransaction";
import coinConfig from "../config";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

function maxBigNumber(a: BigNumber, b: BigNumber): BigNumber {
  return a.isGreaterThan(b) ? a : b;
}

export const prepareTransaction: AccountBridge<
  Transaction,
  TezosAccount
>["prepareTransaction"] = async (account, transaction) => {
  if (account.balance.lte(0)) {
    return Promise.resolve(transaction);
  }

  // basic check to confirm the transaction is "complete"
  if (transaction.mode !== "undelegate") {
    if (!transaction.recipient) {
      return Promise.resolve(transaction);
    }

    const { recipientError } = await validateRecipient(transaction.recipient);
    if (recipientError) {
      return Promise.resolve(transaction);
    }
  }

  const estimation = await getEstimatedFees({ account, transaction });
  const minGasLimit = coinConfig.getCoinConfig().fees.minGasLimit;
  const minStorageLimit = coinConfig.getCoinConfig().fees.minStorageLimit;
  const minFees = coinConfig.getCoinConfig().fees.minFees;
  const minEstimatedFees = coinConfig.getCoinConfig().fees.minEstimatedFees;

  estimation.gasLimit = maxBigNumber(estimation.gasLimit, new BigNumber(minGasLimit));
  estimation.storageLimit = maxBigNumber(estimation.storageLimit, new BigNumber(minStorageLimit));
  estimation.fees = maxBigNumber(estimation.fees, new BigNumber(minFees));
  estimation.estimatedFees = maxBigNumber(
    estimation.estimatedFees,
    new BigNumber(minEstimatedFees),
  );
  const tx: Transaction = {
    ...transaction,
    ...estimation,
  };

  // nothing changed
  if (
    bnEq(tx.estimatedFees, transaction.estimatedFees) &&
    bnEq(tx.fees, transaction.fees) &&
    bnEq(tx.gasLimit, transaction.gasLimit) &&
    bnEq(tx.storageLimit, transaction.storageLimit) &&
    bnEq(tx.amount, transaction.amount) &&
    tx.taquitoError === transaction.taquitoError
  ) {
    return transaction;
  }

  return tx;
};

export default prepareTransaction;
