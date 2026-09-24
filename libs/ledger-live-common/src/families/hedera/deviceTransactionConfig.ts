import { MAP_STAKING_MODE_TO_METHOD } from "@ledgerhq/coin-hedera/constants";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { buildIntentData, computeIntentType } from "./bridge/api";
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
  const stakingMethod = MAP_STAKING_MODE_TO_METHOD[computeIntentType(transaction)];

  if (stakingMethod) {
    fields.push({ type: "text", label: "Method", value: stakingMethod });

    if (!estimatedFees.isZero()) {
      fields.push({ type: "fees", label: "Fees" });
    }

    const intentData = buildIntentData(transaction);
    if (intentData.type === "staking" && typeof intentData.stakingNodeId === "number") {
      fields.push({
        type: "text",
        label: "Staked Node ID",
        value: String(intentData.stakingNodeId),
      });
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

  return fields;
}

export default getDeviceTransactionConfig;
