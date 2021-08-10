import type { AccountLike, Account, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";

export type ExtraDeviceTransactionField =
  | {
      type: "stellar.memo";
      label: string;
    }
  | {
      type: "stellar.network";
      label: string;
    };

function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField | ExtraDeviceTransactionField> {
  const fields: Array<DeviceTransactionField | ExtraDeviceTransactionField> = [
    {
      type: "stellar.network",
      label: "Network",
    },
  ];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  fields.push({
    type: "stellar.memo",
    label: "Memo",
  });

  //NB device displays [none] for an empty memo
  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
