// @flow
import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Account } from "@ledgerhq/types-live";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Transaction } from "@ledgerhq/live-common/families/avalanchepchain/types";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import {
  DataRow,
  TextValueField,
} from "../../components/ValidateOnDeviceDataRow";
import Info from "../../icons/Info";

type FieldProps = {
  account: Account;
  transaction: Transaction;
  field: DeviceTransactionField;
};

const getAvalancheAppDate = (unixTimestamp: BigNumber) =>
  `${new Date(unixTimestamp.toNumber() * 1000)
    .toISOString()
    .split(".")[0]
    .replace("T", " ")} UTC`;

function AvalancheValidatorNameField({ transaction, field }: FieldProps) {
  const validatorNode = transaction.recipient;

  return (
    <>
      <TextValueField label={field.label} value={validatorNode} />
    </>
  );
}

function AvalancheValidatorAmountField({
  transaction,
  account,
  field,
}: FieldProps) {
  invariant(
    transaction.family === "avalanchepchain",
    "not an avalanchepchain family transaction",
  );

  const unit = getAccountUnit(account);

  const { amount } = transaction;

  return (
    <TextValueField
      label={field.label}
      value={<CurrencyUnitValue unit={unit} value={amount} />}
    />
  );
}

function AvalancheStakeStartField({ transaction, field }: FieldProps) {
  invariant(
    transaction.family === "avalanchepchain",
    "not an avalanchepchain family transaction",
  );

  const { startTime } = transaction;
  const stakeStartTime = getAvalancheAppDate(startTime);

  return <TextValueField label={field.label} value={stakeStartTime} />;
}

function AvalancheStakeEndField({ transaction, field }: FieldProps) {
  invariant(
    transaction.family === "avalanchepchain",
    "not an avalanchepchain family transaction",
  );

  const { endTime } = transaction;
  const stakeEndTime = getAvalancheAppDate(endTime);

  return <TextValueField label={field.label} value={stakeEndTime} />;
}

function Warning({ transaction }: FieldProps) {
  invariant(
    transaction.family === "avalanchepchain",
    "avalanchepchain transaction",
  );
  const { colors } = useTheme();

  const { t } = useTranslation();

  switch (transaction.mode) {
    case "delegate":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText
            semiBold
            style={[styles.text, styles.infoText]}
            color="live"
            numberOfLines={3}
          >
            {t(`ValidateOnDevice.recipientWording.delegate`)}
          </LText>
        </DataRow>
      );
    default:
      return null;
  }
}

const fieldComponents = {
  "avalanchepchain.validatorName": AvalancheValidatorNameField,
  "avalanchepchain.validatorAmount": AvalancheValidatorAmountField,
  "avalanchepchain.stakeStart": AvalancheStakeStartField,
  "avalanchepchain.stakeEnd": AvalancheStakeEndField,
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
