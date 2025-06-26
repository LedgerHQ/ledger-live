import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import {
  Operation as CoreOperation,
  Asset,
  TransactionIntent,
  TokenInfoCommon,
} from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";

export function adaptCoreOperationToLiveOperation(
  accountId: string,
  op: CoreOperation<Asset<TokenInfoCommon>>,
): Operation {
  // NOTE: missing extra.
  // extra.assetCode
  // extra.assetIssue
  // NOTE: should use this, but typescript fights against it
  // if (op.asset?.type === "token") {
  //   res.extra.assetCode = op.asset.assetCode;
  // // if (op.asset && op.asset.assetCode) {
  //
  // }

  const extra: { assetCode?: string; assetIssuer?: string; ledgerOpType?: string | undefined } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.asset?.type === "token") {
    extra.assetCode = op.asset.assetCode;
    extra.assetIssuer = op.asset.assetIssuer;
  }

  const res = {
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
    extra,
  };

  if (op.tx.hash === "82a5f702a19b22d645b0d306e13d6854be16ce1c4f2e271f5c35561d0a5e5015") {
    console.log({ adaptCoreOperationCore: op, res });
    // debugger;
  }
  return res;
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
    asset: {},
  };
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
  sequenceNumber?: number,
): Operation => {
  const type = transaction["mode"] === "changeTrust" ? "OPT_IN" : "OUT";
  const fees = transaction["fees"] ?? BigNumber(0);

  // const { subAccountId } = transaction;
  // const { subAccounts } = account;

  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", "OUT"),
    hash: "",
    type: "OUT",
    // value: transaction.amount,
    value: subAccountId ? fees : transaction.amount, // match old behavior
    fee: transaction["fees"] ?? BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber: sequenceNumber ?? 0,
    accountId: account.id,
    date: new Date(),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

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
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
