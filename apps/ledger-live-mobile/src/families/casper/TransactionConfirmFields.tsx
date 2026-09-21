import invariant from "invariant";
import React from "react";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { ExtraDeviceTransactionField } from "@ledgerhq/coin-casper/deviceTransactionConfig";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { DataRowUnitValue } from "~/components/ValidateOnDeviceDataRow";

interface FieldProps {
  account: Account;
  transaction: Transaction;
  field: DeviceTransactionField;
  status: TransactionStatus;
}

function CasperExtendedAmountField({ account, field, transaction }: FieldProps) {
  const currency = getAccountCurrency(account);
  invariant(transaction.family === "casper", "casper transaction");

  return (
    <DataRowUnitValue
      label={field.label}
      unit={currency.units[1]}
      value={new BigNumber((field as ExtraDeviceTransactionField).value)}
    />
  );
}

const fieldComponents = {
  "casper.extendedAmount": CasperExtendedAmountField,
};

export default {
  fieldComponents,
};
