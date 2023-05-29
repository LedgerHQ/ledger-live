import eip55 from "eip55";
import {
  Account,
  Operation,
  OperationType,
  TokenAccount,
} from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { encodeOperationId } from "../../operation";
import { findSubAccountById } from "../../account";
import { getEstimatedFees } from "./logic";
import BigNumber from "bignumber.js";

/**
 * Build an optimistic operation for the coin of the integration (e.g. Ether for Ethereum)
 */
export const buildOptimisticCoinOperation = (
  account: Account,
  transaction: EvmTransaction,
  transactionType?: OperationType
): Operation => {
  const type = transactionType ?? "OUT";
  const estimatedFees = getEstimatedFees(transaction);
  const value = transaction.amount.plus(estimatedFees);

  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    id: encodeOperationId(account.id, "", type), // <--
    hash: "", // <--
    type,
    value,
    fee: estimatedFees,
    blockHash: null, // <--
    blockHeight: null, // <--
    senders: [eip55.encode(account.freshAddress)],
    recipients: [eip55.encode(transaction.recipient)],
    accountId: account.id,
    transactionSequenceNumber: transaction.nonce,
    date: new Date(), // <--
    extra: {},
  };

  return operation;
};

/**
 * Build an optimistic operation for an ERC20 transaction
 */
export const buildOptimisticTokenOperation = (
  account: Account,
  tokenAccount: TokenAccount,
  transaction: EvmTransaction
): Operation => {
  const type = "OUT";
  const estimatedFees = getEstimatedFees(transaction);
  const value = transaction.useAllAmount
    ? tokenAccount.balance
    : transaction.amount;

  const coinOperation = buildOptimisticCoinOperation(
    account,
    {
      ...transaction,
      recipient: tokenAccount.token.contractAddress,
      amount: new BigNumber(0),
    },
    "FEES"
  );
  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    ...coinOperation,
    subOperations: [
      {
        id: encodeOperationId(tokenAccount.id, "", type), // <--
        hash: "", // <--
        type,
        value,
        fee: estimatedFees,
        blockHash: null, // <--
        blockHeight: null, // <--
        senders: [eip55.encode(account.freshAddress)],
        recipients: [eip55.encode(transaction.recipient)],
        accountId: tokenAccount.id,
        transactionSequenceNumber: transaction.nonce,
        date: new Date(), // <--
        extra: {},
        contract: tokenAccount.token.contractAddress,
      },
    ],
  };

  return operation;
};

/**
 * Create a temporary operation to use until it's confirmed by the blockchain
 */
export const buildOptimisticOperation = (
  account: Account,
  transaction: EvmTransaction
): Operation => {
  const subAccount = findSubAccountById(
    account,
    transaction?.subAccountId || ""
  );
  const isTokenTransaction = subAccount?.type === "TokenAccount";

  return isTokenTransaction
    ? buildOptimisticTokenOperation(account, subAccount, transaction)
    : buildOptimisticCoinOperation(account, transaction);
};

export default buildOptimisticOperation;
