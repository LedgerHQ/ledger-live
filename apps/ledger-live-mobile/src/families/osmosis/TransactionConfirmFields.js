// @flow
import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getAccountUnit,
  shortAddressPreview,
} from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { mapDelegationInfo } from "@ledgerhq/live-common/families/cosmos/logic";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import {
  DataRow,
  TextValueField,
} from "../../components/ValidateOnDeviceDataRow";
import Info from "../../icons/Info";

type FieldProps = {
  account: Account,
  transaction: Transaction,
  field: DeviceTransactionField,
  status: TransactionStatus,
};

function CosmosDelegateValidatorsField({ account, transaction }: FieldProps) {
  const { t } = useTranslation();

  const unit = getAccountUnit(account);
  const { validators } = useCosmosFamilyPreloadData("osmosis");
  const mappedDelegations = mapDelegationInfo(
    transaction.validators,
    validators,
    unit,
  );

  const { validator, formattedAmount, address } = mappedDelegations[0];

  return (
    <>
      <TextValueField
        label={t("ValidateOnDevice.amount")}
        value={formattedAmount}
      />
      <TextValueField
        label={t("ValidateOnDevice.validatorName")}
        value={validator.name}
      />
      <TextValueField
        label={t("ValidateOnDevice.validatorAddress")}
        value={shortAddressPreview(address)}
      />
    </>
  );
}

function CosmosValidatorNameField({ field, transaction: tx }: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData("osmosis");
  const validator = validators.find(
    v => v.validatorAddress === tx.validators[0].address,
  );

  return (
    <TextValueField
      label={field.label}
      value={validator?.name ?? tx.validators[0].address}
    />
  );
}

function CosmosSourceValidatorNameField({
  field,
  transaction: { sourceValidator },
}: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData("osmosis");
  if (!sourceValidator) {
    return null;
  }
  const validator = validators.find(
    v => v.validatorAddress === sourceValidator,
  );

  return (
    <TextValueField
      label={field.label}
      value={validator?.name ?? sourceValidator}
    />
  );
}

function Warning({ transaction }: FieldProps) {
  invariant(transaction.family === "osmosis", "osmosis transaction");
  const { colors } = useTheme();

  const { t } = useTranslation();

  switch (transaction.mode) {
    case "redelegate":
    case "claimReward":
    case "undelegate":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText
            semiBold
            style={[styles.text, styles.infoText]}
            color="live"
            numberOfLines={3}
          >
            {t(`ValidateOnDevice.infoWording.osmosis.${transaction.mode}`)}
          </LText>
        </DataRow>
      );
    default:
      return null;
  }
}

function OsmosisExtendedAmountField({
  account,
  status: { amount },
  field,
}: FieldProps) {
  const unit = getAccountUnit(account);

  return (
    <TextValueField
      label={field.label}
      value={
        <CurrencyUnitValue
          unit={unit}
          value={field.value ?? amount}
          disableRounding
        />
      }
    />
  );
}

const fieldComponents = {
  "cosmos.delegateValidators": CosmosDelegateValidatorsField,
  "cosmos.validatorName": CosmosValidatorNameField,
  "cosmos.sourceValidatorName": CosmosSourceValidatorNameField,
  "osmosis.extendedAmount": OsmosisExtendedAmountField,
};

export default {
  fieldComponents,
  warning: Warning,
};

const styles = StyleSheet.create({
  text: {
    textAlign: "right",
    flex: 1,
  },
  infoText: {
    textAlign: "left",
    marginLeft: 8,
  },
});
