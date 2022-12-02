// @flow

import invariant from "invariant";
import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";

const addressStyle = {
  wordBreak: "break-all",
  textAlign: "right",
  maxWidth: "70%",
};

const StacksExtendedAmountField = ({
  account,
  status: { amount },
  transaction,
  field,
}: FieldComponentProps) => {
  invariant(transaction.family === "stacks", "stacks transaction");
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const specifiedAmount = field.value != null ? field.value : null;
  return (
    <TransactionConfirmField label={field.label}>
      <Box textAlign="right">
        <FormattedVal
          color={"palette.text.shade80"}
          disableRounding={true}
          unit={unit}
          val={specifiedAmount ?? amount}
          fontSize={3}
          inline
          showCode
        />
        <Box textAlign="right">
          <FormattedVal
            color={"palette.text.shade40"}
            disableRounding={true}
            unit={currency.units[1]}
            subMagnitude={1}
            prefix={"("}
            val={specifiedAmount ?? amount}
            suffix={")"}
            fontSize={3}
            inline
            showCode
          />
        </Box>
      </Box>
    </TransactionConfirmField>
  );
};

const StacksMemoField = ({
  transaction,
  field,
}: {
  transaction: Transaction,
  field: DeviceTransactionField,
}) => {
  invariant(transaction.family === "stacks", "stacks transaction");

  return (
    <TransactionConfirmField label={field.label}>
      <Text style={addressStyle} ml={1} ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {field.value}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  "stacks.extendedAmount": StacksExtendedAmountField,
  "stacks.memo": StacksMemoField,
};

export default {
  fieldComponents,
};
