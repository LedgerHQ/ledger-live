import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import type {
  GenericTransaction,
  GenericTransactionMode,
} from "../../bridge/generic-coin-framework/types";

/**
 * Generic mode names, not the legacy `HEDERA_TRANSACTION_MODES` enum — `delegate`/`undelegate`/
 * `redelegate` are unchanged, but the legacy `claim-rewards` is `claimReward` here (association is
 * handled separately below, keyed on the generic `tokenAssociate` mode). Values match coin-hedera's
 * own `MAP_STAKING_MODE_TO_METHOD` (`constants.ts`) so the device screen reads the same regardless of
 * which bridge produced the transaction.
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

  // ERC20 sends only: `families/hedera/bridge/api.ts`'s `buildIntentData` only ever sets `gasLimit`
  // on a `send`-mode transaction, matching the legacy `coin-hedera/src/deviceTransactionConfig.ts`.
  if (!isTokenAssociate && transaction.gasLimit) {
    fields.push({ type: "text", label: "Gas Limit", value: transaction.gasLimit.toString() });
  }

  if (transaction.memoValue) {
    fields.push({ type: "text", label: "Memo", value: transaction.memoValue });
  }

  return fields;
}

export default getDeviceTransactionConfig;
