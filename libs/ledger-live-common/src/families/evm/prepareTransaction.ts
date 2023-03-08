import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { validateAmount, validateRecipient } from "./getTransactionStatus";
import { Transaction as EvmTransaction } from "./types";
import { findSubAccountById } from "../../account";
import { getEstimatedFees } from "./logic";
import {
  DEFAULT_GAS_LIMIT,
  getTransactionData,
  getTypedTransaction,
} from "./transaction";
import {
  getFeesEstimation,
  getGasEstimation,
  getTransactionCount,
} from "./api/rpc";

/**
 * Prepare basic coin transactions or smart contract interactions (other than live ERC20 transfers)
 * Should be used for transactions coming from the wallet API
 * Handling addition of gas limit
 */
export const prepareCoinTransaction = async (
  account: Account,
  typedTransaction: EvmTransaction
): Promise<EvmTransaction> => {
  const estimatedFees = getEstimatedFees(typedTransaction);
  const amount = typedTransaction.useAllAmount
    ? account.balance.minus(estimatedFees)
    : typedTransaction.amount;
  const totalSpent = amount.plus(estimatedFees);
  const protoTransaction = { ...typedTransaction, amount };

  const [recipientErrors] = validateRecipient(account, typedTransaction);
  const [amountErrors] = validateAmount(account, protoTransaction, totalSpent);
  if (Object.keys(amountErrors).length || Object.keys(recipientErrors).length) {
    return typedTransaction;
  }

  const gasLimit = typedTransaction.data
    ? await getGasEstimation(account, protoTransaction)
    : DEFAULT_GAS_LIMIT; // For a coin transaction, no need for gas limit estimation, just use the default one

  return {
    ...protoTransaction,
    amount,
    gasLimit,
  };
};

/**
 * Prepare ERC20 transactions.
 * Handling addition of ERC20 transfer data and gas limit
 */
export const prepareTokenTransaction = async (
  account: Account,
  tokenAccount: TokenAccount,
  typedTransaction: EvmTransaction
): Promise<EvmTransaction> => {
  const amount = typedTransaction.useAllAmount
    ? tokenAccount.balance
    : typedTransaction.amount;
  const protoTransaction = {
    ...typedTransaction,
    amount: new BigNumber(0),
  };
  const [recipientErrors] = validateRecipient(account, protoTransaction);
  const [amountErrors] = validateAmount(tokenAccount, protoTransaction, amount);
  if (Object.keys(amountErrors).length || Object.keys(recipientErrors).length) {
    return typedTransaction;
  }

  const data = getTransactionData({ ...typedTransaction, amount });
  // As we're interacting with a smart contract,
  // it's going to be our real recipient for the tx
  const gasLimit = await getGasEstimation(account, {
    ...protoTransaction,
    recipient: tokenAccount.token.contractAddress,
    data,
  });
  // Recipient isn't changed here as it would change on the UI end as well
  // The change will be handled by the `prepareForSignOperation` method
  return {
    ...typedTransaction,
    data,
    gasLimit,
  };
};

/**
 * Method called to update a transaction into a state that would make it valid
 * (E.g. Adding fees, add smart contract data, etc...)
 */
export const prepareTransaction = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const { currency } = account;
  // Get the current network status fees
  const feeData = await getFeesEstimation(currency);
  const subAccount = findSubAccountById(
    account,
    transaction.subAccountId || ""
  );
  const isTokenTransaction = subAccount?.type === "TokenAccount";
  const typedTransaction = getTypedTransaction(transaction, feeData);

  return isTokenTransaction
    ? await prepareTokenTransaction(account, subAccount, typedTransaction)
    : await prepareCoinTransaction(account, typedTransaction);
};

/**
 * Prepare the transaction for the signOperation step.
 * For now, used to changed the recipient for TokenAccount transfers
 * with the smart contract address as recipient and add the nonce
 * (which would change as well in the UI if it was done before that step)
 */
export const prepareForSignOperation = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const nonce = await getTransactionCount(
    account.currency,
    account.freshAddress
  );

  const subAccount = findSubAccountById(
    account,
    transaction.subAccountId || ""
  );
  const isTokenTransaction = subAccount?.type === "TokenAccount";

  return isTokenTransaction
    ? {
        ...transaction,
        amount: new BigNumber(0),
        recipient: subAccount.token.contractAddress,
        nonce,
      }
    : {
        ...transaction,
        nonce,
      };
};
