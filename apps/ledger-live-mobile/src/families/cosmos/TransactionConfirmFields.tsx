import invariant from "invariant";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getAccountUnit,
  shortAddressPreview,
} from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { mapDelegationInfo } from "@ledgerhq/live-common/families/cosmos/logic";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import {
  DataRow,
  TextValueField,
} from "../../components/ValidateOnDeviceDataRow";
import Info from "../../icons/Info";

type FieldProps = {
  account: Account;
  transaction: Transaction;
  field: {
    type: string;
    label: string;
  };
};

function CosmosDelegateValidatorsField({ account, transaction }: FieldProps) {
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);
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
        label={t("ValidateOnDevice.validator")}
        value={
          <View style={styles.lineLabel}>
            <LText semiBold>{shortAddressPreview(address)}</LText>
            <LText style={styles.validatorLabel} color="grey">
              {validator?.name ?? null}
            </LText>
          </View>
        }
      />
    </>
  );
}

function CosmosValidatorNameField({
  account,
  field,
  transaction: tx,
}: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);
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
  account,
  field,
  transaction: { sourceValidator },
}: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);

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
  lineLabel: {
    justifyContent: "flex-end",
  },
  validatorLabel: {
    fontSize: 12,
  },
});
