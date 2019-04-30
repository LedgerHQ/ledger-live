// @flow

import type { Operation, CryptoCurrency } from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import type { CoreOperation } from "../types";
import perFamily from "../../generated/libcore-buildOperation";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN"
};

export async function buildOperation(arg: {
  coreOperation: CoreOperation,
  accountId: string,
  currency: CryptoCurrency
}) {
  const { coreOperation, accountId, currency } = arg;
  const buildOp = perFamily[currency.family];
  if (!buildOp) {
    throw new Error(currency.family + " family not supported");
  }
  const rest = await buildOp(arg);

  const operationType = await coreOperation.getOperationType();
  const type = OperationTypeMap[operationType];
  const id = `${accountId}-${rest.hash}-${type}`;

  const coreValue = await coreOperation.getAmount();
  let value = await libcoreAmountToBigNumber(coreValue);

  const coreFee = await coreOperation.getFees();
  if (!coreFee) throw new Error("fees should not be null");
  const fee = await libcoreAmountToBigNumber(coreFee);

  if (type === "OUT") {
    value = value.plus(fee);
  }

  const blockHeight = await coreOperation.getBlockHeight();

  const [recipients, senders] = await Promise.all([
    coreOperation.getRecipients(),
    coreOperation.getSenders()
  ]);

  const date = new Date(await coreOperation.getDate());

  const op: $Exact<Operation> = {
    id,
    type,
    value,
    fee,
    senders,
    recipients,
    blockHeight,
    blockHash: null, // FIXME: why? (unused)
    accountId,
    date,
    extra: {},
    ...rest
  };

  return op;
}
