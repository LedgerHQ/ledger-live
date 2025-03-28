import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import { Operation as CoreOperation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";

export function adaptCoreOperationToLiveOperation(
  accountId: string,
  op: CoreOperation<void>,
): Operation {
  return {
    id: encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: op.type as OperationType,
    value: new BigNumber(op.value.toString()),
    fee: new BigNumber(op.tx.fees.toString()),
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: op.senders,
    recipients: op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence as number,
    extra: {},
  };
}

export function transactionToIntent(
  _account: Account,
  transaction: TransactionCommon,
): TransactionIntent<any> {
  return {
    type: "send",
    sender: _account.freshAddress,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toString()),
  };
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
): Operation => {
  return {
    id: encodeOperationId(account.id, "", "OUT"),
    hash: "",
    type: "OUT",
    value: transaction.amount,
    fee: BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {},
  };
};
