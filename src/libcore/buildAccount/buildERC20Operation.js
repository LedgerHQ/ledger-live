// @flow

import { BigNumber } from "bignumber.js";
import type { Operation, TokenCurrency } from "../../types";
import { libcoreBigIntToBigNumber } from "../buildBigNumber";
import type { CoreERC20LikeOperation } from "../types";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN"
};

export async function buildERC20Operation(arg: {
  coreOperation: CoreERC20LikeOperation,
  accountId: string,
  token: TokenCurrency
}) {
  const { coreOperation, accountId } = arg;

  const hash = await coreOperation.getHash();

  const operationType = await coreOperation.getOperationType();
  const type = OperationTypeMap[operationType];
  const id = `${accountId}-${hash}-${type}`;

  const coreValue = await coreOperation.getValue();
  let value = await libcoreBigIntToBigNumber(coreValue);

  const fee = BigNumber(0); // FIXME need a getFees() in ETH CoreAmount

  if (type === "OUT") {
    value = value.plus(fee);
  }

  const blockHeight = 0; // FIXME no way to get blockHeight ?!

  const receiver = await coreOperation.getReceiver();
  const sender = await coreOperation.getSender();

  const date = new Date(await coreOperation.getTime());

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
    extra: {}
  };

  return op;
}
