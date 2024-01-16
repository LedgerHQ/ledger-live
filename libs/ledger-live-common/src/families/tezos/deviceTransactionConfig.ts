import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getMainAccount } from "../../account";

export type ExtraDeviceTransactionField =
  | {
      type: "tezos.delegateValidator";
      label: string;
    }
  | {
      type: "tezos.storageLimit";
      label: string;
    };

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
  const source = account.type === "ChildAccount" ? account.address : mainAccount.freshAddress;
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
