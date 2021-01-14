// @flow
import React from "react";
import invariant from "invariant";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  Account,
  AccountLike,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";

import { getDeviceTransactionConfig } from "@ledgerhq/live-common/lib/transaction";
import type { DeviceTransactionField } from "@ledgerhq/live-common/lib/transaction";
import { getDeviceModel } from "@ledgerhq/devices";

import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import VerifyAddressDisclaimer from "./VerifyAddressDisclaimer";
import perFamilyTransactionConfirmFields from "../generated/TransactionConfirmFields";
import { DataRowUnitValue, TextValueField } from "./ValidateOnDeviceDataRow";
import Animation from "./Animation";
import getDeviceAnimation from "./DeviceAction/getDeviceAnimation";

export type FieldComponentProps = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
  field: DeviceTransactionField,
};

export type FieldComponent = React$ComponentType<FieldComponentProps>;

function AmountField({
  account,
  parentAccount,
  status,
  field,
}: FieldComponentProps) {
  let unit;
  if (account.type === "TokenAccount") {
    unit = getAccountUnit(account);
  } else {
    const mainAccount = getMainAccount(account, parentAccount);
    unit = getAccountUnit(mainAccount);
  }
  return (
    <DataRowUnitValue label={field.label} unit={unit} value={status.amount} />
  );
}

function FeesField({
  account,
  parentAccount,
  status,
  field,
}: FieldComponentProps) {
  const mainAccount = getMainAccount(account, parentAccount);
  const { estimatedFees } = status;
  const feesUnit = getAccountUnit(mainAccount);
  return (
    <DataRowUnitValue
      label={field.label}
      unit={feesUnit}
      value={estimatedFees}
    />
  );
}

function AddressField({ field }: FieldComponentProps) {
  invariant(field.type === "address", "AddressField invalid");
  return <TextValueField label={field.label} value={field.address} />;
}

// NB Leaving AddressField although I think it's redundant at this point
// in case we want specific styles for addresses.
function TextField({ field }: FieldComponentProps) {
  invariant(field.type === "text", "TextField invalid");
  return <TextValueField label={field.label} value={field.value} />;
}

const commonFieldComponents: { [_: *]: FieldComponent } = {
  amount: AmountField,
  fees: FeesField,
  address: AddressField,
  text: TextField,
};

type Props = {
  device: Device,
  status: TransactionStatus,
  transaction: Transaction,
  account: AccountLike,
  parentAccount: ?Account,
};

export default function ValidateOnDevice({
  device,
  account,
  parentAccount,
  status,
  transaction,
}: Props) {
  const { dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const r = perFamilyTransactionConfirmFields[mainAccount.currency.family];

  const fieldComponents = {
    ...commonFieldComponents,
    ...(r && r.fieldComponents),
  };
  const Warning = r && r.warning;
  const Title = r && r.title;

  const fields = getDeviceTransactionConfig({
    account,
    parentAccount,
    transaction,
    status,
  });

  const transRecipientWording = t(
    `ValidateOnDevice.recipientWording.${transaction.mode || "send"}`,
  );
  const recipientWording =
    transRecipientWording !==
    `ValidateOnDevice.recipientWording.${transaction.mode || "send"}`
      ? transRecipientWording
      : t("ValidateOnDevice.recipientWording.send");

  const transTitleWording = t(
    `ValidateOnDevice.title.${transaction.mode || "send"}`,
    getDeviceModel(device.modelId),
  );
  const titleWording =
    transTitleWording !== `ValidateOnDevice.title.${transaction.mode || "send"}`
      ? transTitleWording
      : t("ValidateOnDevice.title.send", getDeviceModel(device.modelId));

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.picture}>
            <Animation
              source={getDeviceAnimation({ device, key: "validate", theme })}
            />
          </View>
          {Title ? (
            <Title
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
              status={status}
            />
          ) : (
            <View style={styles.titleContainer}>
              <LText secondary semiBold style={styles.title}>
                {titleWording}
              </LText>
            </View>
          )}

          <View style={styles.dataRows}>
            {fields.map((field, i) => {
              const MaybeComponent = fieldComponents[field.type];
              if (!MaybeComponent) {
                console.warn(
                  `TransactionConfirm field ${field.type} is not implemented! add a generic implementation in components/TransactionConfirm.js or inside families/*/TransactionConfirmFields.js`,
                );
                return null;
              }
              return (
                <MaybeComponent
                  key={i}
                  field={field}
                  account={account}
                  parentAccount={parentAccount}
                  transaction={transaction}
                  status={status}
                />
              );
            })}

            {Warning ? (
              <Warning
                account={account}
                parentAccount={parentAccount}
                transaction={transaction}
                recipientWording={recipientWording}
                status={status}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footerContainer}>
        <VerifyAddressDisclaimer text={recipientWording} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dataRows: {
    marginVertical: 24,
    alignSelf: "stretch",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  footerContainer: {
    padding: 16,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  picture: {
    marginBottom: 40,
  },
  titleContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
  },
});
