import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount, getAccountUnit } from "@ledgerhq/live-common/account/index";

import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import type { FieldComponentProps } from "~/renderer/components/TransactionConfirm";
import WarnBox from "~/renderer/components/WarnBox";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";

const Info = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  mt: 6,
  mb: 4,
  px: 5,
}))`
  text-align: center;
`;

const IconFreesField = ({ account, parentAccount, transaction, field }: FieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(transaction.family === "icon", "icon transaction");
  const feesUnit = getAccountUnit(mainAccount);
  const { fees } = transaction;

  return (
    <Box horizontal justifyContent="space-between" mb={2}>
      <TransactionConfirmField label={field.label} />
      <FormattedVal
        color={"palette.text.shade80"}
        unit={feesUnit}
        val={fees}
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

const fieldComponents = {
  "icon.fees": IconFreesField,
};

export default {
  fieldComponents,
  warning: Warning,
  title: Title,
  disableFees: () => true,
};
