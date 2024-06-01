import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import {
  AccountType,
  Methods,
  expectedToFieldForTokenTransfer,
  getAccountUnit,
  methodToString,
} from "./utils";

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
    }
  | {
      type: "filecoin.recipient";
      label: string;
      value: string;
    };

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const tokenTransfer = input.account.type === AccountType.TokenAccount;
  const subAccount = tokenTransfer ? (input.account as TokenAccount) : null;

  const fields: Array<DeviceTransactionField> = [];
  const unit = input.parentAccount
    ? input.parentAccount.currency.units[0]
    : getAccountUnit(input.account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: false,
  };

  if (subAccount) {
    const value = expectedToFieldForTokenTransfer(input.transaction.recipient);
    fields.push({
      type: "filecoin.recipient",
      label: "To",
      value,
    });
  }

  fields.push({
    type: "filecoin.gasLimit",
    label: "Gas Limit",
    value: formatCurrencyUnit(unit, input.transaction.gasLimit, formatConfig),
  });

  if (!subAccount) {
    fields.push({
      type: "filecoin.gasFeeCap",
      label: "Gas Fee Cap",
      value: formatCurrencyUnit(unit, input.transaction.gasFeeCap, formatConfig),
    });

    fields.push({
      type: "filecoin.gasPremium",
      label: "Gas Premium",
      value: formatCurrencyUnit(unit, input.transaction.gasPremium, formatConfig),
    });
    fields.push({
      type: "filecoin.method",
      label: "Method",
      value: methodToString(input.transaction.method),
    });
  }

  if (subAccount) {
    fields.push({
      type: "filecoin.method",
      label: "Method",
      value: methodToString(Methods.ERC20Transfer),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
