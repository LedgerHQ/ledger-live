// @flow

import { BigNumber } from "bignumber.js";
import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";
import { CoreEthereumLikeInternalTransaction } from "./types";
import { OperationTypeMap } from "../../libcore/buildAccount/buildOperation";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

async function buildInternalOperation(
  tx: CoreEthereumLikeInternalTransaction,
  {
    accountId,
    internalTransactionIndex,
    hash,
    blockHeight,
    date,
    status,
    transactionSequenceNumber
  }
): Promise<?Operation> {
  const operationType = await tx.getOperationType();
  const type = OperationTypeMap[operationType];
  if (!type) return null;

  const coreValue = await tx.getValue();
  const value = await libcoreBigIntToBigNumber(coreValue);

  const receiver = await tx.getReceiver();
  const sender = await tx.getSender();

  const out: $Exact<Operation> = {
    id: `${accountId}-${hash}-${type}-internal${internalTransactionIndex}`,
    type,
    value,
    senders: [sender],
    recipients: [receiver],
    fee: BigNumber(0),
    blockHeight,
    blockHash: null,
    accountId,
    date,
    transactionSequenceNumber,
    hash,
    extra: {}
  };
  if (status === 0) {
    out.hasFailed = true;
  }
  return out;
}

async function ethereumBuildOperation(
  {
    coreOperation
  }: {
    coreOperation: CoreOperation
  },
  partialOp: $Shape<Operation>
) {
  const ethereumLikeOperation = await coreOperation.asEthereumLikeOperation();
  const ethereumLikeTransaction = await ethereumLikeOperation.getTransaction();
  const status = await ethereumLikeTransaction.getStatus();
  const hash = await ethereumLikeTransaction.getHash();
  const transactionSequenceNumber = await ethereumLikeTransaction.getNonce();
  const out: $Shape<Operation> = { hash, transactionSequenceNumber };
  if (status === 0) {
    out.hasFailed = true;
  }

  const internalTransactions = await ethereumLikeOperation.getInternalTransactions();
  const ops: Array<?Operation> = await Promise.all(
    internalTransactions.map((internalTx, internalTransactionIndex) =>
      buildInternalOperation(internalTx, {
        accountId: partialOp.accountId,
        internalTransactionIndex,
        hash,
        blockHeight: partialOp.blockHeight,
        date: partialOp.date,
        status,
        transactionSequenceNumber
      })
    )
  );
  out.internalOperations = ops.filter(Boolean);

  return out;
}

export default ethereumBuildOperation;
