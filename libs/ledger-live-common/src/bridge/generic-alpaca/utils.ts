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
  const extra: {
    assetCode?: string;
    assetIssuer?: string;
    assetAmount?: string | undefined;
    ledgerOpType?: string | undefined;
  } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.details?.assetAmount !== undefined) {
    extra.assetAmount = op.details.assetAmount as string;
  }

  if (op.asset?.type === "token") {
    extra.assetCode = op.asset.assetCode;
    extra.assetIssuer = op.asset.assetIssuer;
  }

  const res = {
    id: extra.ledgerOpType
      ? encodeOperationId(accountId, op.tx.hash, extra.ledgerOpType)
      : encodeOperationId(accountId, op.tx.hash, op.type),
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

  return res;
}

export function transactionToIntent(
  account: Account,
  transaction: TransactionCommon & {
    assetIssuer?: string;
    assetCode?: string;
    mode?: string;
    fees?: BigNumber | null | undefined;
  },
): TransactionIntent<any> {
  // NOTE: why Payment here and not PAYMENT like in getTransactionStatus
  let transactionType = "Payment"; // NOTE: assuming payment by default here, can be changed based on transaction.mode
  if (transaction.mode) {
    switch (transaction.mode) {
      case "changetrust":
        transactionType = "changeTrust";
        break;
      case "send":
        transactionType = "send";
        break;

      default:
        throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
    }
  }
  const res = {
    fees: transaction?.fees ? transaction.fees : null,
    type: transactionType,
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount: fromBigNumberToBigInt(transaction.amount, BigInt(0)),
    asset: {},
  };
  if (transaction.assetCode && transaction.assetIssuer) {
    res.asset = {
      assetCode: transaction.assetCode,
      assetIssuer: transaction.assetIssuer,
    };
  }
  return res;
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: TransactionCommon,
  sequenceNumber?: number,
): Operation => {
  const type = transaction["mode"] === "changeTrust" ? "OPT_IN" : "OUT";
  const fees = transaction["fees"] ?? BigNumber(0);

  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type: type,
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
