// @flow

import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount,getAccountUnit } from "@ledgerhq/live-common/account/index";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import type { FieldComponentProps } from "~/renderer/components/TransactionConfirm";
import Text from "~/renderer/components/Text";
import WarnBox from "~/renderer/components/WarnBox";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { OperationDetailsVotes } from "./operationDetails";

const Info: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  mt: 6,
  mb: 4,
  px: 5,
}))`
  text-align: center;
`;

const AddressText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
`;


const IconVotesField = ({ account, parentAccount, transaction, field }: FieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(transaction.family === "icon", "icon transaction");
  const { votes } = transaction;
  if (!votes) return null;
  return (
    <Box vertical justifyContent="center" mb={2}>
      <TransactionConfirmField label={field.label} />
      <OperationDetailsVotes votes={votes} account={mainAccount} isTransactionField={true} />
    </Box>
  );
};

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
  transaction: Transaction,
  recipientWording: string,
}) => {
  invariant(transaction.family === "icon", "icon transaction");

  switch (transaction.mode) {
    case "claimReward":
    case "freeze":
    case "unfreeze":
    case "vote":
      return null;
    default:
      return (
        <WarnBox>
          <Trans i18nKey="TransactionConfirm.warning" values={{ recipientWording }} />
        </WarnBox>
      );
  }
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
  "icon.votes": IconVotesField,
  "icon.fees": IconFreesField
};

export default {
  fieldComponents,
  warning: Warning,
  title: Title,
  disableFees: () => true,
};
