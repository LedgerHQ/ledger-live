// @flow

import { BigNumber } from "bignumber.js";
import { AlgorandOperationTypeEnum } from "./types";
import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};

export async function buildASAOperation(arg: {
  coreOperation: CoreOperation,
  accountId: string,
  tokenId: string,
}) {
  const { coreOperation, accountId, tokenId } = arg;
  const algorandOperation = await coreOperation.asAlgorandOperation();
  const transaction = await algorandOperation.getTransaction();
  const hash = await transaction.getId();

  const algoOpeType = await algorandOperation.getAlgorandOperationType();
  if (
    ![
      AlgorandOperationTypeEnum.ASSET_OPT_OUT,
      AlgorandOperationTypeEnum.ASSET_TRANSFER,
    ].includes(algoOpeType)
  ) {
    return null;
  }
  const transferInfo = await transaction.getAssetTransferInfo();
  if ((await transferInfo.getAssetId()) !== tokenId) {
    return null;
  }
  const operationType = await coreOperation.getOperationType();
  const type = OperationTypeMap[operationType];
  const id = `${accountId}-${hash}-${type}`;

  const blockHeight = parseInt(await transaction.getRound());

  const value = await algorandOperation.getAssetAmount();
  const receiver =
    algoOpeType === 8
      ? [
          await transferInfo.getRecipientAddress(),
          await transferInfo.getCloseAddress(),
        ]
      : [await transferInfo.getRecipientAddress()];

  const fee = await transaction.getFee();
  const sender = await transaction.getSender();
  const date = new Date(await coreOperation.getDate());

  const op: $Exact<Operation> = {
    id,
    type,
    value: BigNumber(value),
    hash,
    fee: BigNumber(fee),
    senders: [sender],
    recipients: receiver,
    blockHeight,
    blockHash: null, // FIXME: why? (unused)
    accountId,
    date,
    extra: {},
  };

  return op;
}
