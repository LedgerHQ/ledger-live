import eip55 from "eip55";
import { Account, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../operation";
import { Transaction as EvmTransaction } from "./types";
import { getEstimatedFees } from "./logic";

/**
 * Create a temporary operation to use until it's confirmed by the blockchain
 */
export const buildOptimisticOperation = (
  account: Account,
  transaction: EvmTransaction
): Operation => {
  const type = "OUT";
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

export default buildOptimisticOperation;
