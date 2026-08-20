import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import type {
  GenericTransaction,
  GenericTransactionMode,
} from "../../bridge/generic-coin-framework/types";

/**
 * Generic mode names, not the legacy `HEDERA_TRANSACTION_MODES` enum — `delegate`/`undelegate`/
 * `redelegate` are unchanged, but the legacy `claim-rewards` is `claimReward` here (there is no
 * legacy `token-associate` counterpart in this map; see `isChangeTrust` below). Values match
 * coin-hedera's own `MAP_STAKING_MODE_TO_METHOD` (`constants.ts`) so the device screen reads the same
 * regardless of which bridge produced the transaction.
 */
const STAKING_METHOD_BY_MODE: Partial<Record<GenericTransactionMode, string>> = {
  delegate: "Delegate",
  undelegate: "Undelegate",
  redelegate: "Redelegate",
  claimReward: "Claim Rewards",
};

async function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: GenericTransaction;
  status: TransactionStatusCommon;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const stakingMethod = transaction.mode && STAKING_METHOD_BY_MODE[transaction.mode];

  if (stakingMethod) {
    fields.push({ type: "text", label: "Method", value: stakingMethod });

    if (!estimatedFees.isZero()) {
      fields.push({ type: "fees", label: "Fees" });
    }

    if (transaction.valId) {
      fields.push({ type: "text", label: "Staked Node ID", value: transaction.valId });
    }

    return fields;
  }

  const isChangeTrust = transaction.mode === "changeTrust";
  fields.push({
    type: "text",
    label: "Method",
    value: isChangeTrust
      ? "Associate Token"
      : transaction.useAllAmount
        ? "Transfer All"
        : "Transfer",
  });

  if (!isChangeTrust) {
    fields.push({ type: "amount", label: "Amount" });
  }

  if (!estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fees" });
  }

  return fields;
}

export default getDeviceTransactionConfig;
