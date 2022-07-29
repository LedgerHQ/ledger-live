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
  const fields: {
    type: string;
    label: string;
    value?: string;
    address?: string;
  }[] = [];

  switch (mode) {
    case "send":
      fields.push({
        type: "amount",
        label: "Amount",
      });
      fields.push({
        type: "address",
        label: "Address",
        address: transaction.recipient,
      });
      fields.push({
        type: "text",
        label: "Network",
        value: account.currency.name.replace("Lite", "").trim(),
      });
      break;

    default:
      break;
  }

  fields.push({
    type: "fees",
    label: "Max fees",
  });

  return fields as Array<DeviceTransactionField>;
}

export default getDeviceTransactionConfig;
