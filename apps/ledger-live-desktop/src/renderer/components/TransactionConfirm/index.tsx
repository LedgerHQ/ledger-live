import invariant from "invariant";
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import {
  DeviceTransactionField,
  getDeviceTransactionConfig,
} from "@ledgerhq/live-common/transaction/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import WarnBox from "~/renderer/components/WarnBox";
import useTheme from "~/renderer/hooks/useTheme";
import FormattedVal from "~/renderer/components/FormattedVal";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import TransactionConfirmField from "./TransactionConfirmField";
import { getLLDCoinFamily } from "~/renderer/families";
import { FieldComponentProps as FCPGeneric } from "~/renderer/families/types";
import { Link } from "react-router-dom";
import { openURL } from "~/renderer/linking";
import Alert from "~/renderer/components/Alert";
import { DeviceBlocker } from "../DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "../DeviceAction/animations";
import Animation from "~/renderer/animations";

const FieldText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
`;

const HorizontalSeparator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
`;

export type FieldComponentProps = FCPGeneric<Account, TransactionCommon, TransactionStatus>;
export type FieldComponent = React.ComponentType<FieldComponentProps>;

const termsOfUse = {
  paraswap: "https://paraswap.io/tos",
  "1inch": "https://1inch.io/assets/1inch_network_terms_of_use.pdf",
};

const AmountField = ({ account, status: { amount }, field }: FieldComponentProps) => (
  <TransactionConfirmField label={field.label}>
    <FormattedVal
      color={"palette.text.shade80"}
      unit={getAccountUnit(account)}
      val={amount}
      fontSize={3}
      inline
      showCode
      alwaysShowValue
      disableRounding
    />
  </TransactionConfirmField>
);
const FeesField = ({ account, parentAccount, status, field }: FieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { estimatedFees } = status;
  const feesUnit = getAccountUnit(mainAccount);
  return (
    <TransactionConfirmField label={field.label}>
      <FormattedVal
        color={"palette.text.shade80"}
        disableRounding
        unit={feesUnit}
        val={estimatedFees}
        fontSize={3}
        inline
        showCode
        alwaysShowValue
      />
    </TransactionConfirmField>
  );
};
const AddressField = ({ field }: FieldComponentProps) => {
  invariant(field.type === "address", "AddressField invalid");
  return (
    <TransactionConfirmField label={field.label}>
      <FieldText>{field.address}</FieldText>
    </TransactionConfirmField>
  );
};

// NB Leaving AddressField although I think it's redundant at this point
// in case we want specific styles for addresses.
const TextField = ({ field }: FieldComponentProps) => {
  invariant(field.type === "text", "TextField invalid");
  return (
    <TransactionConfirmField
      label={field.label}
      tooltipKey={field.tooltipI18nKey}
      tooltipArgs={field.tooltipI18nArgs}
    >
      <FieldText>{field.value}</FieldText>
    </TransactionConfirmField>
  );
};
const commonFieldComponents: Record<string, FieldComponent> = {
  amount: AmountField,
  fees: FeesField,
  address: AddressField,
  text: TextField,
};
const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  pb: 4,
}))``;
const Info = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  mt: 6,
  mb: 4,
  px: 5,
}))`
  text-align: center;
`;
type Props = {
  t: TFunction;
  device: Device;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  manifestId?: string | null;
  manifestName?: string | null;
  status: TransactionStatus;
};
const TransactionConfirm = ({
  t,
  device,
  account,
  parentAccount,
  transaction,
  manifestId,
  manifestName,
  status,
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const type = useTheme().colors.palette.type;
  if (!device) return null;
  const specific = getLLDCoinFamily(mainAccount.currency.family);
  const r = specific?.transactionConfirmFields;
  const fieldComponents: Record<string, FieldComponent> = {
    ...commonFieldComponents,
    ...r?.fieldComponents,
  };
  const Warning = r?.warning;
  const Title = r?.title;
  const Footer = r?.footer;
  const fields = getDeviceTransactionConfig({
    account,
    parentAccount,
    transaction,
    status,
  });
  const key = ("mode" in transaction && transaction.mode) || "send";
  const recipientWording = t(`TransactionConfirm.recipientWording.${key}`);

  console.log(fields);

  const typeTransaction: string =
    (
      fields.find(
        (field: { label: string }) => field.label && field.label === "Type",
      ) as DeviceTransactionField & { value: string }
    )?.value || "";

  const amountTransaction: string =
    (
      fields.find(
        (field: { label: string }) => field.label && field.label === "Amount",
      ) as DeviceTransactionField & { value: string }
    )?.value || "";
  return typeTransaction === "Approve" ? (
    <Container style={{ paddingBottom: 0 }}>
      <Container paddingX={26}>
        <DeviceBlocker />
        <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
        <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22} marginBottom={12}>
          {t("approve.description")}
        </Text>
        <Alert type="primary" mb={26}>
          <Trans
            i18nKey={
              amountTransaction === "Unlimited MATIC" ? "approve.unlimited" : "approve.limited"
            }
            values={{
              recipientWording,
            }}
          />
        </Alert>
        <Box
          style={{
            width: "100%",
          }}
          mb={20}
        >
          {fields.map((field, i) => {
            const MaybeComponent = fieldComponents[field.type];
            if (!MaybeComponent) {
              console.log(
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
        </Box>
      </Container>
      {Footer ? (
        <>
          <HorizontalSeparator />
          <Footer transaction={transaction} />
        </>
      ) : manifestId === "paraswap" ? (
        <>
          <HorizontalSeparator />
          <Text marginTop={30}>
            <Trans i18nKey="approve.warning" />{" "}
            <Link onClick={() => openURL(termsOfUse[manifestId])} to={"https://www.ledger.com"}>
              <Trans i18nKey="approve.termsAndConditions" values={{ appName: manifestName }} />
            </Link>
          </Text>
        </>
      ) : null}
    </Container>
  ) : (
    <Container>
      {Warning ? (
        <Warning
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          recipientWording={recipientWording}
          status={status}
        />
      ) : (
        <WarnBox>
          <Trans
            i18nKey="TransactionConfirm.warning"
            values={{
              recipientWording,
            }}
          />
        </WarnBox>
      )}
      {Title ? (
        <Title
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          status={status}
        />
      ) : (
        <Info>
          <Trans i18nKey="TransactionConfirm.title" />
        </Info>
      )}

      <Box
        style={{
          width: "100%",
        }}
        px={30}
        mb={20}
      >
        {fields.map((field, i) => {
          const MaybeComponent = fieldComponents[field.type];
          if (!MaybeComponent) {
            console.log(
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
      </Box>

      {Footer ? <Footer transaction={transaction} /> : null}

      {renderVerifyUnwrapped({
        modelId: device.modelId,
        type,
      })}
    </Container>
  );
};
export default withTranslation()(TransactionConfirm);
