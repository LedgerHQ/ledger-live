import invariant from "invariant";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { mapDelegationInfo } from "@ledgerhq/live-common/families/cosmos/logic";
import {
  resolveSourceValidator,
  resolveTransactionValidators,
} from "@ledgerhq/coin-cosmos/buildTransaction";
import { useTheme } from "@react-navigation/native";
import LText from "~/components/LText";
import { DataRow, TextValueField } from "~/components/ValidateOnDeviceDataRow";
import Info from "~/icons/Info";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

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
  const unit = useAccountUnit(account);
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);
  const mappedDelegations = mapDelegationInfo(
    resolveTransactionValidators(transaction),
    validators,
    unit,
  );
  if (mappedDelegations.length === 0) return null;
  const { validator, formattedAmount, address } = mappedDelegations[0];
  return (
    <>
      <TextValueField
        label={t("ValidateOnDevice.amount")}
        value={formattedAmount}
        testID="device-validation-amount"
      />
      <TextValueField
        label={t("ValidateOnDevice.validator")}
        value={
          <View style={styles.lineLabel}>
            <LText semiBold style={styles.addressLabel}>
              {shortAddressPreview(address)}
            </LText>
            <LText style={styles.validatorLabel} color="grey" testID="device-validation-provider">
              {validator?.name ?? null}
            </LText>
          </View>
        }
      />
    </>
  );
}

function CosmosValidatorNameField({ account, field, transaction: tx }: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);
  const address = resolveTransactionValidators(tx)[0]?.address;
  if (!address) return null;
  const validator = validators.find(v => v.validatorAddress === address);
  return <TextValueField label={field.label} value={validator?.name ?? address} />;
}

function CosmosSourceValidatorNameField({ account, field, transaction }: FieldProps) {
  const { validators } = useCosmosFamilyPreloadData(account.currency.id);
  const sourceValidator = resolveSourceValidator(transaction);

  if (!sourceValidator) {
    return null;
  }

  const validator = validators.find(v => v.validatorAddress === sourceValidator);
  return <TextValueField label={field.label} value={validator?.name ?? sourceValidator} />;
}

function Warning({ account, transaction }: FieldProps) {
  invariant(transaction.family === "cosmos", "cosmos transaction");
  const { colors } = useTheme();
  const { t } = useTranslation();
  const crypto = cryptoFactory(account.currency.id);

  switch (transaction.mode) {
    case "redelegate":
    case "claimReward":
    case "undelegate":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText semiBold style={[styles.text, styles.infoText]} color="live" numberOfLines={3}>
            {t(`ValidateOnDevice.infoWording.cosmos.${transaction.mode}`, {
              numberOfDays: crypto.unbondingPeriod,
            })}
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
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  addressLabel: {
    textAlign: "right",
  },
  validatorLabel: {
    fontSize: 12,
    textAlign: "right",
  },
});
