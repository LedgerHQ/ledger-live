import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { Transaction, TransactionStatus } from "../types";

export type ExtraDeviceTransactionField =
  | {
      type: "tezos.delegateValidator";
      label: string;
    }
  | {
      type: "tezos.storageLimit";
      label: string;
    };
type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction: { mode, recipient },
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;
  const isDelegateOperation = mode === "delegate";
  const fields: Array<DeviceTransactionField> = [
    {
      type: "address",
      label: "Source",
      address: source,
    },
  ];

  if (isDelegateOperation) {
    fields.push(
      {
        type: "tezos.delegateValidator",
        label: "Validator",
      },
      {
        type: "address",
        label: "Delegate",
        address: recipient,
      },
    );
  }

  if (!amount.isZero()) {
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

  fields.push({
    type: "tezos.storageLimit",
    label: "Storage Limit",
  });
  return fields;
}

export default getDeviceTransactionConfig;
