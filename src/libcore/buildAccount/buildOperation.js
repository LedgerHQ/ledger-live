// @flow

import type { Operation, CryptoCurrency, TokenAccount } from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import { inferSubOperations } from "../../account";
import type { CoreOperation } from "../types";
import perFamily from "../../generated/libcore-buildOperation";

export const OperationTypeMap = {
  "0": "OUT",
  "1": "IN"
};

export async function buildOperation(arg: {
  coreOperation: CoreOperation,
  accountId: string,
  currency: CryptoCurrency,
  contextualTokenAccounts?: ?(TokenAccount[])
}) {
  const { coreOperation, accountId, currency, contextualTokenAccounts } = arg;
  const buildOp = perFamily[currency.family];
  if (!buildOp) {
    throw new Error(currency.family + " family not supported");
  }

  const operationType = await coreOperation.getOperationType();
  const type = OperationTypeMap[operationType] || "NONE";

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

  const partialOp = {
    type,
    value,
    fee,
    senders,
    recipients,
    blockHeight,
    blockHash: null,
    accountId,
    date,
    extra: {}
  };

  const rest = await buildOp(arg, partialOp);
  const id = `${accountId}-${rest.hash}-${type}`;

  const op: $Exact<Operation> = {
    id,
    subOperations: contextualTokenAccounts
      ? inferSubOperations(rest.hash, contextualTokenAccounts)
      : undefined,
    ...partialOp,
    ...rest
  };

  return op;
}
