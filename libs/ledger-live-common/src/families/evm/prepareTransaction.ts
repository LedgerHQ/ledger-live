import BigNumber from "bignumber.js";
import { getFeesEstimation, getGasEstimation } from "./api/rpc";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
} from "./types";
import { Account } from "@ledgerhq/types-live";
import { getEstimatedFees } from "./logic";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { validateAmount, validateRecipient } from "./getTransactionStatus";

export const prepareTransaction = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const { currency } = account;
  const estimatedFees = getEstimatedFees(transaction);
  // Not final amount (cause it could change depending on tx type) used for gas estimation
  // Some RPCs will throw at gas estimation if the account doesn't have the required amount first
  const tempAmount = transaction.useAllAmount
    ? account.balance.minus(estimatedFees)
    : transaction.amount;
  const totalSpent = tempAmount?.plus(estimatedFees);

  const [recipientvalidationErrors] = validateRecipient(account, transaction);
  const [amountValidationErrors] = validateAmount(
    account,
    transaction,
    totalSpent
  );
  const { recipient: recipientErrors } = recipientvalidationErrors || {};
  const { amount: amountErrors } = amountValidationErrors || {};
  const [gasLimit, feeData] = await Promise.all([
    // Validating recipient and amount first cause estimating a transaction with a wrong recipient or wrong amount will throw an error
    recipientErrors || amountErrors
      ? Promise.resolve(new BigNumber(21000))
      : getGasEstimation(account, transaction),
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
