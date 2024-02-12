import invariant from "invariant";
import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { FieldComponentProps } from "~/renderer/components/TransactionConfirm";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";

const addressStyle: React.CSSProperties = {
  wordBreak: "break-all",
  textAlign: "right",
  maxWidth: "70%",
};

const StacksExtendedAmountField = ({ account, status: { amount }, field }: FieldComponentProps) => {
  invariant(field.type === "stacks.extendedAmount", "stacks.extendedAmount field expected");
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

const StacksMemoField = ({ field }: { field: DeviceTransactionField }) => {
  invariant(field.type === "stacks.memo", "stacks.memo field expected");
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
