import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import { formatCurrencyUnit, getCryptoCurrencyById } from "../../currencies";
import { methodToString } from "./utils";

const currency = getCryptoCurrencyById("filecoin");

export type ExtraDeviceTransactionField =
  | {
      type: "filecoin.gasFeeCap";
      label: string;
      value: string;
    }
  | {
      type: "filecoin.gasPremium";
      label: string;
      value: string;
    }
  | {
      type: "filecoin.gasLimit";
      label: string;
      value: string;
    }
  | {
      type: "filecoin.method";
      label: string;
      value: string;
    };

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Value",
  });
  fields.push({
    type: "filecoin.gasLimit",
    label: "Gas Limit",
    value: input.transaction.gasLimit.toFixed(),
  });
  fields.push({
    type: "filecoin.gasPremium",
    label: "Gas Premium",
    value: formatCurrencyUnit(currency.units[0], input.transaction.gasPremium, {
      showCode: false,
      disableRounding: true,
    }),
  });
  fields.push({
    type: "filecoin.gasFeeCap",
    label: "Gas Fee Cap",
    value: formatCurrencyUnit(currency.units[0], input.transaction.gasFeeCap, {
      showCode: false,
      disableRounding: true,
    }),
  });
  fields.push({
    type: "filecoin.method",
    label: "Method",
    value: methodToString(input.transaction.method),
  });

  return fields;
}

export default getDeviceTransactionConfig;
