import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import WarnBox from "~/renderer/components/WarnBox";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Alert from "~/renderer/components/Alert";
import { FieldComponentProps } from "../types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type {
  IconAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/icon/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Info = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  mt: 6,
  mb: 4,
  px: 5,
}))`
  text-align: center;
`;

const IconFreesField = ({
  account,
  parentAccount,
  transaction,
  field,
}: FieldComponentProps<IconAccount, Transaction, TransactionStatus>) => {
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(transaction.family === "icon", "icon transaction");
  const unit = useAccountUnit(mainAccount);

  const { fees } = transaction;
  return (
    <Box horizontal justifyContent="space-between" mb={2}>
      <TransactionConfirmField label={field.label} />
      <FormattedVal
        color={"palette.text.shade80"}
        unit={unit}
        val={fees || 0}
        fontSize={3}
        inline
        showCode
        alwaysShowValue
        subMagnitude={5}
      />
    </Box>
  );
};

const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction;
  recipientWording: string;
}) => {
  invariant(transaction.family === "icon", "icon transaction");
  return (
    <WarnBox>
      <Trans i18nKey="TransactionConfirm.warning" values={{ recipientWording }} />
    </WarnBox>
  );
};

const Title = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "icon", "icon transaction");

  return (
    <Info>
      <Trans i18nKey={`TransactionConfirm.titleWording.${transaction.mode}`} />
    </Info>
  );
};

const Footer = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "icon", "icon transaction");
  return (
    <Alert type="secondary">
      <Trans i18nKey={`icon.networkFees`} />
    </Alert>
  );
};

const fieldComponents = {
  "icon.fees": IconFreesField,
};

export default {
  fieldComponents,
  warning: Warning,
  title: Title,
  footer: Footer,
  disableFees: () => true,
};
