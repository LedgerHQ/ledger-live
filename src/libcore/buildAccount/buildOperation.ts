import { log } from "@ledgerhq/logs";
import type {
  Operation,
  CryptoCurrency,
  SubAccount,
  AccountLike,
} from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import { inferSubOperations } from "../../account";
import type { Core, CoreOperation } from "../types";
import perFamily from "../../generated/libcore-buildOperation";
import { getEnv } from "../../env";
export const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};
export async function buildOperation(arg: {
  core: Core;
  coreOperation: CoreOperation;
  accountId: string;
  currency: CryptoCurrency;
  contextualSubAccounts?: SubAccount[] | null | undefined;
  existingAccount: AccountLike | null | undefined;
}): Promise<Operation | null> {
  const { coreOperation, accountId, currency, contextualSubAccounts } = arg;
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
    type === "IN" && currency.family === "bitcoin"
      ? coreOperation.getSelfRecipients()
      : coreOperation.getRecipients(),
    coreOperation.getSenders(),
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
    extra: {},
  };
  const rest = await buildOp(arg, partialOp);
  if (!rest) return null;
  const id = `${accountId}-${rest.hash}-${rest.type || type}${
    rest.extra && rest.extra.id ? "-" + rest.extra.id : ""
  }`;
  const op: Operation = {
    id,
    subOperations: contextualSubAccounts
      ? inferSubOperations(rest.hash, contextualSubAccounts)
      : undefined,
    ...partialOp,
    ...rest,
  };
  const OPERATION_ADDRESSES_LIMIT = getEnv("OPERATION_ADDRESSES_LIMIT");

  if (op.recipients.length > OPERATION_ADDRESSES_LIMIT) {
    log(
      "warning",
      `operation.recipients too big (${op.recipients.length} > ${OPERATION_ADDRESSES_LIMIT}) – ${id}`
    );
    op.recipients.splice(OPERATION_ADDRESSES_LIMIT);
  }

  if (op.senders.length > OPERATION_ADDRESSES_LIMIT) {
    log(
      "warning",
      `operation.senders too big (${op.senders.length} > ${OPERATION_ADDRESSES_LIMIT}) – ${id}`
    );
    op.senders.splice(OPERATION_ADDRESSES_LIMIT);
  }

  return op;
}
