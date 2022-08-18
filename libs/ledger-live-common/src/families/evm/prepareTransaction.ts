import BigNumber from "bignumber.js";
import { getFeesEstimation, getGasEstimation } from "./api/rpc";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
} from "./types";
import { Account } from "@ledgerhq/types-live";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { validateRecipient } from "./getTransactionStatus";

export const prepareTransaction = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const { currency } = account;

  const [validationErrors] = validateRecipient(account, transaction);
  const { recipient: recipientErrors } = validationErrors || {};
  const [gasLimit, feeData] = await Promise.all([
    // Validating recipient first cause estimating a transaction with a wrong recipient will throw an error
    recipientErrors
      ? Promise.resolve(new BigNumber(21000))
      : getGasEstimation(currency, transaction),
    // Fee data is not dependent on the gasEstimation so they can be triggered in parallel
    getFeesEstimation(currency),
  ]);

  // First the transaction is creating with its correct type, in order for the `estimateMaxSpendable` to be correct
  // Doing the `estimateMaxSpendable` first would give a potentially incorrect amount if the transaction if transform from a
  // type 2 to a type 0 (1559 to Legacy)
  const typedTransaction = (() => {
    // If the blockchain is supporting EIP-1559, use maxFeePerGas & maxPriorityFeePerGas
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      delete transaction.gasPrice;
      return {
        ...transaction,
        gasLimit,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        type: 2,
      } as EvmTransactionEIP1559;
    }

    // Else just use a legacy transaction
    delete transaction.maxFeePerGas;
    delete transaction.maxPriorityFeePerGas;
    return {
      ...transaction,
      gasLimit,
      gasPrice: feeData.gasPrice || new BigNumber(0),
      type: 0,
    } as EvmTransactionLegacy;
  })();
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account, transaction: typedTransaction })
    : transaction.amount;

  return {
    ...typedTransaction,
    amount,
  };
};
