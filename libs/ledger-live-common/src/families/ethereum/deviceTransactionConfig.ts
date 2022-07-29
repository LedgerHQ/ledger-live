import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import { modes } from "./modules";

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const {
    transaction,
    status: { estimatedFees },
  } = input;
  const m = modes[transaction.mode];
  const fields: Array<DeviceTransactionField> = [];

  if (m && m.fillDeviceTransactionConfig) {
    m.fillDeviceTransactionConfig(input, fields);
  }

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Max fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
