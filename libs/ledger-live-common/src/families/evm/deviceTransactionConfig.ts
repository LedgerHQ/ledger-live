import { Account } from "@ledgerhq/types-live";
import { DeviceTransactionField } from "../../transaction";
import { Transaction as EvmTransaction } from "./types";
import { TransactionStatus } from "../../generated/types";

function getDeviceTransactionConfig({
  account,
  transaction,
}: {
  account: Account;
  transaction: EvmTransaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode } = transaction;
  const fields: Array<DeviceTransactionField> = [];

  switch (mode) {
    default:
    case "send":
      fields.push(
        {
          type: "amount",
          label: "Amount",
        },
        {
          type: "address",
          label: "Address",
          address: transaction.recipient,
        },
        {
          type: "text",
          label: "Network",
          value: account.currency.name,
        }
      );
      break;
  }

  fields.push({
    type: "fees",
    label: "Max fees",
  });

  return fields;
}

export default getDeviceTransactionConfig;
