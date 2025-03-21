import invariant from "invariant";
import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { CasperFieldComponentProps } from "./types";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/casper/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const CasperExtendedAmountField = ({
  account,
  status: { amount },
  transaction,
  field,
}: CasperFieldComponentProps) => {
  invariant(transaction.family === "casper", "casper transaction");
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const specifiedAmount = (field as ExtraDeviceTransactionField).value;

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

const fieldComponents = {
  "casper.extendedAmount": CasperExtendedAmountField,
};

export default {
  fieldComponents,
};
