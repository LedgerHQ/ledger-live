import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";

export type ExtraDeviceTransactionField = {
  type: "stacks.memo";
  label: string;
  value: string;
};

export type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

async function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const { transaction } = input;
  const fields: Array<DeviceTransactionField> = [];
  const nonceField: DeviceTransactionField = {
    type: "text",
    label: "Nonce",
    value: transaction.nonce ? transaction.nonce.toFixed() : "0",
  };

  // A pox-5 stake or unstake has no recipient and no memo: it targets the pool in `valAddress`.
  if (transaction.mode === "delegate" || transaction.mode === "undelegate") {
    if (transaction.valAddress) {
      fields.push({ type: "address", label: "Pool", address: transaction.valAddress });
    }
    if (transaction.mode === "delegate") {
      fields.push({ type: "amount", label: "Amount" });
      const numCycles = transaction.familySpecificData?.numCycles;
      if (numCycles !== undefined) {
        fields.push({ type: "text", label: "Number of cycles", value: numCycles.toString() });
      }
    }
    fields.push(nonceField);
    return fields;
  }

  fields.push({
    type: "address",
    label: "Recipient",
    address: transaction.recipient,
  });
  fields.push(nonceField);
  fields.push({
    type: "stacks.memo",
    label: "Memo",
    value: transaction.memo || "",
  });

  return fields;
}

export default getDeviceTransactionConfig;
