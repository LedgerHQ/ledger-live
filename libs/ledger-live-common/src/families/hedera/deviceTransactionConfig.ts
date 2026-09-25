import {
  HEDERA_TRANSACTION_MODES,
  MAP_STAKING_MODE_TO_MEMO,
  MAP_STAKING_MODE_TO_METHOD,
} from "@ledgerhq/coin-hedera/constants";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { computeIntentType } from "./bridge/api";
import type { HederaGenericTransaction, TransactionStatus } from "./types";

async function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: HederaGenericTransaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const intentType = computeIntentType(transaction);
  const memo = MAP_STAKING_MODE_TO_MEMO[intentType] ?? transaction.memoValue;
  const method =
    intentType === HEDERA_TRANSACTION_MODES.TokenAssociate
      ? "Associate Token"
      : MAP_STAKING_MODE_TO_METHOD[intentType];

  if (method) {
    fields.push({ type: "text", label: "Method", value: method });

    if (!estimatedFees.isZero()) {
      fields.push({ type: "fees", label: "Fees" });
    }

    if (transaction.valId) {
      fields.push({ type: "text", label: "Staked Node ID", value: transaction.valId });
    }

    if (memo) {
      fields.push({ type: "text", label: "Memo", value: memo });
    }

    return fields;
  }

  fields.push({
    type: "text",
    label: "Method",
    value: transaction.useAllAmount ? "Transfer All" : "Transfer",
  });
  fields.push({ type: "amount", label: "Amount" });

  if (!estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fees" });
  }

  const gasLimit = transaction.feeParameters?.gasLimit;
  if (typeof gasLimit === "string") {
    fields.push({ type: "text", label: "Gas Limit", value: gasLimit });
  }

  if (memo) {
    fields.push({ type: "text", label: "Memo", value: memo });
  }

  return fields;
}

export default getDeviceTransactionConfig;
