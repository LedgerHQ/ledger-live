import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceTransactionField } from "../../transaction";
import { Transaction, TransactionStatus } from "./types";
import { methodToString } from "./utils";

const currency = getCryptoCurrencyById("internet_computer");

function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Transaction Type",
    value: methodToString(0),
  });
  fields.push({
    type: "text",
    label: "Payment (ICP)",
    value: formatCurrencyUnit(currency.units[0], transaction.amount, {
      showCode: false,
      disableRounding: true,
    }),
  });
  fields.push({
    type: "text",
    label: "Maximum fee (ICP)",
    value: formatCurrencyUnit(currency.units[0], transaction.fees, {
      showCode: false,
      disableRounding: true,
    }),
  });
  fields.push({
    type: "text",
    label: "Memo",
    value: transaction.memo ?? "0",
  });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
