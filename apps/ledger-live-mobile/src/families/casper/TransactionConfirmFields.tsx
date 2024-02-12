import invariant from "invariant";
import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { TextValueField } from "~/components/ValidateOnDeviceDataRow";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/casper/deviceTransactionConfig";

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
    <TextValueField
      label={field.label}
      value={
        <CurrencyUnitValue
          unit={currency.units[1]}
          value={(field as ExtraDeviceTransactionField).value}
          disableRounding
        />
      }
    />
  );
}

const fieldComponents = {
  "casper.extendedAmount": CasperExtendedAmountField,
};

export default {
  fieldComponents,
};
