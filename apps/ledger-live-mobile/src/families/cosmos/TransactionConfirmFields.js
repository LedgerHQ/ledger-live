// @flow
import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/cosmos/types";
import { useCosmosPreloadData } from "@ledgerhq/live-common/lib/families/cosmos/react";
import { mapDelegationInfo } from "@ledgerhq/live-common/lib/families/cosmos/logic";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import {
  DataRow,
  TextValueField,
  HeaderRow,
  ValidatorField,
} from "../../components/ValidateOnDeviceDataRow";
import Info from "../../icons/Info";

type FieldProps = {
  account: Account,
  transaction: Transaction,
  field: {
    type: string,
    label: string,
  },
};

function CosmosDelegateValidatorsField({ account, transaction }: FieldProps) {
  const { t } = useTranslation();

  const unit = getAccountUnit(account);
  const { validators } = useCosmosPreloadData();
  const mappedDelegations = mapDelegationInfo(
    transaction.validators,
    validators,
    unit,
  );

  return (
    <>
      <HeaderRow
        label={t("ValidateOnDevice.name")}
        value={t("ValidateOnDevice.amount")}
      />
      {mappedDelegations.map(({ validator, address, formattedAmount }) => (
        <ValidatorField
          address={address}
          name={validator?.name ?? address}
          amount={formattedAmount}
        />
      ))}
    </>
  );
}

function CosmosValidatorNameField({ field, transaction: tx }: FieldProps) {
  const { validators } = useCosmosPreloadData();
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
  transaction: { cosmosSourceValidator },
}: FieldProps) {
  const { validators } = useCosmosPreloadData();
  if (!cosmosSourceValidator) {
    return null;
  }
  const validator = validators.find(
    v => v.validatorAddress === cosmosSourceValidator,
  );

  return (
    <TextValueField
      label={field.label}
      value={validator?.name ?? cosmosSourceValidator}
    />
  );
}

function Warning({ transaction }: FieldProps) {
  invariant(transaction.family === "cosmos", "cosmos transaction");
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
            {t(`ValidateOnDevice.infoWording.cosmos.${transaction.mode}`)}
          </LText>
        </DataRow>
      );
    default:
      return null;
  }
}

const fieldComponents = {
  "cosmos.delegateValidators": CosmosDelegateValidatorsField,
  "cosmos.validatorName": CosmosValidatorNameField,
  "cosmos.sourceValidatorName": CosmosSourceValidatorNameField,
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
