// @flow

import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type BigNumber from "bignumber.js";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/casper/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { TextValueField } from "../../components/ValidateOnDeviceDataRow";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

interface FieldProps {
  account: Account;
  transaction: Transaction;
  field: DeviceTransactionField;
  status: TransactionStatus;
}

function CasperExtendedAmountField({
  account,
  status: { amount },
  field,
}: FieldProps) {
  const currency = getAccountCurrency(account);

  if (!(field as unknown as { value: number | BigNumber }).value) return null;

  return (
    <TextValueField
      label={field.label}
      value={
        <CurrencyUnitValue
          unit={currency.units[1]}
          value={
            (field as unknown as { value: number | BigNumber })?.value ?? amount
          }
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
