import React from "react";
import invariant from "invariant";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getMainAccount, getFeesCurrency, getFeesUnit } from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import {
  getDeviceTransactionConfig,
  DeviceTransactionField,
} from "@ledgerhq/live-common/transaction/index";
import { getDeviceModel } from "@ledgerhq/devices";

import { useTheme } from "@react-navigation/native";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import Alert from "./Alert";
import perFamilyTransactionConfirmFields from "../generated/TransactionConfirmFields";
import { DataRowUnitValue, TextValueField } from "./ValidateOnDeviceDataRow";
import Animation from "./Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { TitleText } from "./DeviceAction/rendering";
import { useAccountUnit } from "~/hooks/useAccountUnit";

export type FieldComponentProps = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  status: TransactionStatus;
  field: DeviceTransactionField;
};

export type FieldComponent = React.ComponentType<FieldComponentProps>;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "150px",
  mb: 10,
})``;

function AmountField({ account, status, field }: FieldComponentProps) {
  const unit = useAccountUnit(account);
  return (
    <DataRowUnitValue
      label={field.label}
      unit={unit}
      value={status.amount}
      testID="device-validation-amount"
    />
  );
}

function FeesField({ account, parentAccount, status, field }: FieldComponentProps) {
  const mainAccount = getMainAccount(account, parentAccount);
  const { estimatedFees } = status;
  const currency = getFeesCurrency(mainAccount);
  const feesUnit = getFeesUnit(currency);
  return <DataRowUnitValue label={field.label} unit={feesUnit} value={estimatedFees} />;
}

function AddressField({ field }: FieldComponentProps) {
  invariant(field.type === "address", "AddressField invalid");
  return (
    <TextValueField label={field.label} value={field.address} testID="device-validation-address" />
  );
}

// NB Leaving AddressField although I think it's redundant at this point
// in case we want specific styles for addresses.
function TextField({ field }: FieldComponentProps) {
  invariant(field.type === "text", "TextField invalid");
  return (
    <TextValueField
      label={field.label}
      value={field.value}
      testID={"device-validation-" + field.label.toLowerCase().replace(/\s+/g, "-")}
    />
  );
}

const commonFieldComponents: Record<string, FieldComponent> = {
  amount: AmountField,
  fees: FeesField,
  address: AddressField,
  text: TextField,
};

type Props = {
  device: Device;
  status: TransactionStatus;
  transaction: Transaction & { mode?: string };
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

type SubComponentCommonProps = {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  device: Device;
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
  const r =
    perFamilyTransactionConfirmFields[
      mainAccount.currency.family as keyof typeof perFamilyTransactionConfirmFields
    ];

  const fieldComponents = {
    ...commonFieldComponents,
    ...(r && r.fieldComponents),
  };
  const Warning =
    r &&
    (
      r as {
        warning?: React.ComponentType<SubComponentCommonProps & { recipientWording: string }>;
      }
    ).warning;
  const Title =
    r &&
    (
      r as {
        title?: React.ComponentType<SubComponentCommonProps>;
      }
    ).title;
  const Footer =
    r &&
    (
      r as {
        footer?: React.ComponentType<{
          transaction: Transaction;
          recipientWording: string;
        }>;
      }
    ).footer;

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
    transRecipientWording !== `ValidateOnDevice.recipientWording.${transaction.mode || "send"}`
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
    <Flex flex={1}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        testID="device-validation-scroll-view"
      >
        <Flex alignItems="center">
          <AnimationContainer>
            <Animation
              source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
              style={getDeviceAnimationStyles(device.modelId)}
            />
          </AnimationContainer>
          {Title ? (
            <Title
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
              status={status}
              device={device}
            />
          ) : (
            <TitleText>{titleWording}</TitleText>
          )}

          <DataRowsContainer>
            {fields.map((field, i) => {
              const MaybeComponent = fieldComponents[field.type as keyof typeof fieldComponents] as
                | React.ComponentType<FieldComponentProps>
                | undefined;
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
                device={device}
              />
            ) : null}
          </DataRowsContainer>
        </Flex>
      </ScrollView>
      {Footer ? (
        <Footer transaction={transaction} recipientWording={recipientWording} />
      ) : (
        <Flex>
          <Alert type="help">{recipientWording}</Alert>
        </Flex>
      )}
    </Flex>
  );
}

const DataRowsContainer = styled(Flex).attrs({
  my: 7,
  alignSelf: "stretch",
})``;
