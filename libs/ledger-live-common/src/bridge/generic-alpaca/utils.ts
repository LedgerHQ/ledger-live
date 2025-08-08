import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import {
  Balance,
  Operation as CoreOperation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";

export function extractBalance(balances: Balance[], type: string): Balance {
  return balances.find(balance => balance.asset.type === type) ?? { asset: { type }, value: 0n };
}

export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
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
  account: Account,
  transaction: TransactionCommon,
): TransactionIntent<any> {
  return {
    type: "Payment",
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount: fromBigNumberToBigInt(transaction.amount, BigInt(0)),
    asset: { type: "native" },
  };
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
  sequenceNumber?: number,
): Operation => {
  return {
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
};
