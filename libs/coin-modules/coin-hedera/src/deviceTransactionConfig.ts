import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_MODES } from "./constants";
import { isTokenAssociateTransaction, isStakingTransaction } from "./logic/utils";
import type { Transaction, TransactionStatus } from "./types";

async function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];

  if (isStakingTransaction(transaction)) {
    fields.push({
      type: "text",
      label: "Method",
      value:
        transaction.mode === HEDERA_TRANSACTION_MODES.ClaimRewards
          ? "Claim Rewards"
          : "Update Account",
    });

    if (!estimatedFees.isZero()) {
      fields.push({
        type: "fees",
        label: "Fees",
      });
    }

    if (typeof transaction.properties?.stakingNodeId === "number") {
      fields.push({
        type: "text",
        label: "Staked Node ID",
        value: transaction.properties.stakingNodeId.toString(),
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

  const method = (() => {
    if (isTokenAssociateTransaction(transaction)) return "Associate Token";
    else if (transaction.useAllAmount) return "Transfer All";
    else return "Transfer";
  })();

  fields.push({
    type: "text",
    label: "Method",
    value: method,
  });

  if (!isTokenAssociateTransaction(transaction)) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  if (transaction.mode === HEDERA_TRANSACTION_MODES.Send && transaction.gasLimit) {
    fields.push({
      type: "text",
      label: "Gas Limit",
      value: transaction.gasLimit.toString(),
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
