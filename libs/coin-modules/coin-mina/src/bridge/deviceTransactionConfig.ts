import type { Account } from "@ledgerhq/types-live";
import type { MinaAccount, Transaction, TransactionStatus } from "../types/common";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";

function getDeviceTransactionConfig({
  transaction,
  account,
}: {
  account: MinaAccount;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  if (transaction.txType === "stake") {
    fields.push({
      type: "text",
      label: "Type",
      value: "Delegation",
    });

    fields.push({
      type: "text",
      label: "Delegator",
      value: account.freshAddress,
    });

    fields.push({
      type: "text",
      label: "Delegate",
      value: transaction.recipient,
    });

    fields.push({
      type: "text",
      label: "Fee",
      value: formatCurrencyUnit(account.currency.units[0], transaction.fees.fee, {
        showCode: true,
      }),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
