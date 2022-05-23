import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus } from "../../types";

function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees, totalSpent },
}: {
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const currency = getCryptoCurrencyById("osmosis");
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Amount",
  });

  if (!estimatedFees.isNaN() && estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  if (transaction.memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }

  fields.push({
    type: "text",
    label: "Total",
    value: formatCurrencyUnit(currency.units[0], totalSpent, {
      showCode: true,
    }),
  });

  return fields;
}

export default getDeviceTransactionConfig;
