import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { isStakingTransaction } from "./logic";
import type { Transaction, TransactionStatus } from "./types";

function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  if (isStakingTransaction(transaction)) {
    fields.push({
      type: "text",
      label: "Method",
      value: transaction.properties.mode === "claimRewards" ? "Claim Rewards" : "Update Account",
    });

    if (typeof transaction.properties.stakedNodeId === "number") {
      const { stakedNodeId } = transaction.properties;

      fields.push({
        type: "text",
        label: "Staked Node ID",
        value: `${stakedNodeId}`,
      });
    }

    if (transaction.memo) {
      fields.push({
        type: "text",
        label: "Memo",
        value: transaction.memo,
      });
    }

    return fields;
  }

  if (transaction.useAllAmount) {
    fields.push({
      type: "text",
      label: "Method",
      value: "Transfer All",
    });
  } else {
    fields.push({
      type: "text",
      label: "Method",
      value: "Transfer",
    });
  }

  fields.push({
    type: "amount",
    label: "Amount",
  });

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  if (transaction.memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
