import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType, TransactionCommon } from "@ledgerhq/types-live";
import {
  Operation as CoreOperation,
  TransactionIntent,
  // TokenInfoCommon,
} from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";

/*
 *   assetType: string;
  assetReference?: string; // TODO: recheck with jnicouleau
  assetOwner?: string; // TODO: do we need i ?
*/
export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
  const asset: {
    assetCode?: string;
    assetIssuer?: string;
    assetAmount?: string | undefined;
    ledgerOpType?: string | undefined;
  } = {};
  // console.log("op: ", op);
  let ledgerOpType = "";
  // NOTE: recheck two op.details
  if (op.details?.ledgerOpType !== undefined) {
    // asset.ledgerOpType = op.details.ledgerOpType as string;
    ledgerOpType = op.details.ledgerOpType as string;
  }

  // TODO:
  // debugger;
  let value = new BigNumber(op.value.toString());
  // console.log({
  //   valuePreviously: new BigNumber(op.value.toString()),
  // });

  // NOTE: op.details recheck
  if (op.details?.assetAmount && typeof op.details.assetAmount === "string") {
    value = new BigNumber(op.details.assetAmount);
  }

  // if (op.details?.assetAmount !== undefined) {
  //   extra.assetAmount = op.details.assetAmount as string;
  // }

  // NOTE: we have op.asset.assetType
  if (op.asset?.assetType === "token") {
    // assetId
    asset.assetCode = op.asset.assetReference as string;
    // NOTE: check if used downstream
    asset.assetIssuer = op.asset.assetOwner as string;
  }

  const res = {
    id: ledgerOpType
      ? encodeOperationId(accountId, op.tx.hash, ledgerOpType)
      : encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: (ledgerOpType as OperationType) || (op.type as OperationType),
    value,
    fee: new BigNumber(op.tx.fees.toString()),
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: op.senders,
    recipients: op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence as number,
    asset: {
      assetType: op.asset?.assetType || "native",
      assetReference: asset.assetCode,
      assetOwner: asset.assetIssuer,
    },
    extra: {},
  };
  // console.log("adaptCoreOperationToLiveOperation: ", res);

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
  const res: TransactionIntent<any> = {
    fees: transaction?.fees ? transaction.fees : null,
    type: transactionType,
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount: fromBigNumberToBigInt(transaction.amount, BigInt(0)),
    asset: {
      assetType: "native",
    },
  };
  if (transaction.assetCode && transaction.assetIssuer) {
    res.asset = {
      assetType: "token",
      assetReference: transaction.assetCode,
      assetOwner: transaction.assetIssuer,
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
