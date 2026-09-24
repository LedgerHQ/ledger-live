import { MAP_STAKING_MODE_TO_METHOD } from "@ledgerhq/coin-hedera/constants";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { computeIntentType } from "./bridge/api";
import type { Transaction, TransactionStatus } from "./types";

async function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const stakingMethod = MAP_STAKING_MODE_TO_METHOD[computeIntentType(transaction)];

  if (stakingMethod) {
    fields.push({ type: "text", label: "Method", value: stakingMethod });

    if (!estimatedFees.isZero()) {
      fields.push({ type: "fees", label: "Fees" });
    }

    if (transaction.valId) {
      fields.push({ type: "text", label: "Staked Node ID", value: transaction.valId });
    }

    if (transaction.memoValue) {
      fields.push({ type: "text", label: "Memo", value: transaction.memoValue });
    }

    return fields;
  }

  const isTokenAssociate = transaction.mode === "tokenAssociate";
  fields.push({
    type: "text",
    label: "Method",
    value: isTokenAssociate
      ? "Associate Token"
      : transaction.useAllAmount
        ? "Transfer All"
        : "Transfer",
  });

  if (!isTokenAssociate) {
    fields.push({ type: "amount", label: "Amount" });
  }

  if (!estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fees" });
  }

  if (!isTokenAssociate && transaction.gasLimit) {
    fields.push({ type: "text", label: "Gas Limit", value: transaction.gasLimit.toString() });
  }

  if (transaction.memoValue) {
    fields.push({ type: "text", label: "Memo", value: transaction.memoValue });
  }

  return fields;
}

export default getDeviceTransactionConfig;
