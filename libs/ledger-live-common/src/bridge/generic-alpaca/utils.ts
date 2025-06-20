import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import {
  Operation as CoreOperation,
  Asset,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";

export function adaptCoreOperationToLiveOperation(
  accountId: string,
  op: CoreOperation<Asset>,
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
    type: "Payment",
    sender: _account.freshAddress,
    recipient: transaction.recipient,
    amount: fromBigNumberToBigInt(transaction.amount, BigInt(0)),
    asset: null,
  };
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
  sequenceNumber?: number,
): Operation => {
  const operation: Operation = {
    id: encodeOperationId(account.id, "", "OUT"),
    hash: "",
    type: "OUT",
    value: transaction.amount,
    fee: transaction["fees"] ?? BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber: sequenceNumber ?? 0,
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find(ta => ta.id === subAccountId);

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {},
      },
    ];
  }
  return operation;
};
