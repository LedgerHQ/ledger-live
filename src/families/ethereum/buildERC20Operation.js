// @flow

import type { Operation, TokenCurrency } from "../../types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
import type { CoreERC20LikeOperation } from "./types";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};

export async function buildERC20Operation(arg: {
  coreOperation: CoreERC20LikeOperation,
  accountId: string,
  token: TokenCurrency,
}) {
  const { coreOperation, accountId } = arg;

  const hash = await coreOperation.getHash();

  const operationType = await coreOperation.getOperationType();
  const type = OperationTypeMap[operationType];
  const id = `${accountId}-${hash}-${type}`;

  const coreValue = await coreOperation.getValue();
  const value = await libcoreBigIntToBigNumber(coreValue);

  const usedGas = await libcoreBigIntToBigNumber(
    await coreOperation.getUsedGas()
  );
  const gasLimit = await libcoreBigIntToBigNumber(
    await coreOperation.getGasLimit()
  );
  const gasPrice = await libcoreBigIntToBigNumber(
    await coreOperation.getGasPrice()
  );
  const fee = (usedGas.gt(0) ? usedGas : gasLimit).times(gasPrice);

  const blockHeight = await coreOperation.getBlockHeight();

  const receiver = await coreOperation.getReceiver();
  const sender = await coreOperation.getSender();

  const date = new Date(await coreOperation.getTime());

  const transactionSequenceNumber = (
    await libcoreBigIntToBigNumber(await coreOperation.getNonce())
  ).toNumber();

  const op: $Exact<Operation> = {
    id,
    type,
    value,
    hash,
    fee,
    senders: [sender],
    recipients: [receiver],
    blockHeight,
    blockHash: null, // FIXME: why? (unused)
    accountId,
    date,
    transactionSequenceNumber,
    extra: {},
  };

  return op;
}
