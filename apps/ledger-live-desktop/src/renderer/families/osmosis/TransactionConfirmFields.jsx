// @flow

import invariant from "invariant";
import React from "react";

import type { FieldComponentProps } from "~/renderer/components/TransactionConfirm";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import {
  CosmosDelegateValidatorsField,
  CosmosValidatorNameField,
  CosmosValidatorAmountField,
  CosmosSourceValidatorField,
  Warning,
  Title,
} from "~/renderer/families/cosmos/TransactionConfirmFields";

const OsmosisExtendedAmountField = ({
  account,
  status: { amount },
  transaction,
  field,
}: FieldComponentProps) => {
  invariant(transaction.family === "osmosis", "osmosis transaction");
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

const fieldComponents = {
  "osmosis.extendedAmount": OsmosisExtendedAmountField,
  "cosmos.delegateValidators": CosmosDelegateValidatorsField,
  "cosmos.validatorName": CosmosValidatorNameField,
  "cosmos.validatorAmount": CosmosValidatorAmountField,
  "cosmos.sourceValidatorName": CosmosSourceValidatorField,
};

export default { fieldComponents, warning: Warning, tite: Title };
