import invariant from "invariant";
import React, { useMemo } from "react";
import styled from "styled-components";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceTransactionConfig } from "@ledgerhq/live-common/transaction/index";
import Animation from "~/renderer/animations";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import { getLLDCoinFamily } from "~/renderer/families";
import { FieldComponentProps as FCPGeneric } from "~/renderer/families/types";
import useTheme from "~/renderer/hooks/useTheme";
import ConfirmFooter from "./ConfirmFooter";
import TransactionConfirmField from "./TransactionConfirmField";
import { getDeviceAnimation } from "../DeviceAction/animations";
import { DeviceBlocker } from "../DeviceAction/DeviceBlocker";
import ConfirmAlert from "./ConfirmAlert";
import ConfirmTitle from "./ConfirmTitle";

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

export type FieldComponentProps = FCPGeneric<Account, TransactionCommon, TransactionStatus>;
export type FieldComponent = React.ComponentType<FieldComponentProps>;

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

type Props = {
  device: Device;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  manifestId?: string | null;
  manifestName?: string | null;
  status: TransactionStatus;
};
const TransactionConfirm = ({
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

  const fields = getDeviceTransactionConfig({
    account,
    parentAccount,
    transaction,
    status,
  });

  const typeTransaction: string | undefined = useMemo(() => {
    const typeField = fields.find(field => field.label && field.label === "Type");

    if (typeField && typeField.type === "text" && typeField.value) {
      return typeField.value;
    }
  }, [fields]);

  if (!device) return null;
  const specific = getLLDCoinFamily(mainAccount.currency.family);
  const r = specific?.transactionConfirmFields;
  const fieldComponents: Record<string, FieldComponent> = {
    ...commonFieldComponents,
    ...r?.fieldComponents,
  };
  const Title = r?.title;
  const Footer = r?.footer;

  return (
    <Container style={{ paddingBottom: 0 }}>
      <Container paddingX={26}>
        <DeviceBlocker />
        <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
        <ConfirmTitle
          title={
            Title ? (
              <Title
                account={account}
                parentAccount={parentAccount}
                transaction={transaction}
                status={status}
              />
            ) : null
          }
          account={account}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          typeTransaction={typeTransaction}
        />
        <ConfirmAlert transaction={transaction} typeTransaction={typeTransaction} fields={fields} />
        <Box
          style={{
            width: "100%",
          }}
          mb={20}
        >
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
        </Box>
      </Container>
      <ConfirmFooter
        footer={Footer ? <Footer transaction={transaction} /> : null}
        manifestId={manifestId}
        manifestName={manifestName}
      />
    </Container>
  );
};
export default TransactionConfirm;
