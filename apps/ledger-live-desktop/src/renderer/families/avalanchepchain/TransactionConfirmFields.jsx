// @flow

import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { FieldComponentProps } from "~/renderer/components/TransactionConfirm";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import WarnBox from "~/renderer/components/WarnBox";
import Box from "~/renderer/components/Box";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { openURL } from "~/renderer/linking";
import FormattedVal from "~/renderer/components/FormattedVal";
import moment from "moment";

const Info: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  mb: 4,
  px: 5,
}))`
  text-align: center;
`;

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

const AddressText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
  ${p =>
    p.onClick
      ? `
      cursor: pointer;
    &:hover {
      color: ${p.theme.colors.palette.primary.main};
    }
  `
      : ``}
`;

const onExternalLink = (account, address) => {
  const explorerView = getDefaultExplorerView(account.currency);
  const URL = explorerView && getAddressExplorer(explorerView, address);
  if (URL) openURL(URL);
};

export const AvalancheValidatorNameField = ({
  account,
  parentAccount,
  transaction,
  field,
}: FieldComponentProps) => {
  invariant(transaction.family === "avalanchepchain", "not an avalanchepchain family transaction");
  const mainAccount = getMainAccount(account, parentAccount);

  const validatorNode = transaction.recipient;

  return validatorNode ? (
    <TransactionConfirmField label={field.label}>
      <FieldText>
        <AddressText
          ff="Inter|Regular"
          fontSize={2}
          onClick={() => onExternalLink(mainAccount, validatorNode)}
        >
          {validatorNode}
        </AddressText>
      </FieldText>
    </TransactionConfirmField>
  ) : null;
};

export const AvalancheValidatorAmountField = ({
  account,
  parentAccount,
  transaction,
  field,
}: FieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(transaction.family === "avalanchepchain", "not an avalanchepchain family transaction");

  const unit = getAccountUnit(mainAccount);

  const { amount } = transaction;

  return amount ? (
    <TransactionConfirmField label={field.label}>
      <FieldText>
        <FormattedVal
          color={"palette.text.shade80"}
          unit={unit}
          val={amount}
          fontSize={3}
          showCode
          showAllDigits
        />
      </FieldText>
    </TransactionConfirmField>
  ) : null;
};

export const AvalancheStakeStartField = ({ transaction, field }: FieldComponentProps) => {
  invariant(transaction.family === "avalanchepchain", "not an avalanchepchain family transaction");

  const { startTime } = transaction;
  const stakeStartTime =
    startTime &&
    moment
      .unix(transaction.startTime)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss UTC");

  return stakeStartTime ? (
    <TransactionConfirmField label={field.label}>
      <Text ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {stakeStartTime}
      </Text>
    </TransactionConfirmField>
  ) : null;
};

export const AvalancheStakeEndField = ({ transaction, field }: FieldComponentProps) => {
  invariant(transaction.family === "avalanchepchain", "not an avalanchepchain family transaction");

  const { endTime } = transaction;
  const stakeEndTime =
    endTime &&
    moment
      .unix(transaction.endTime)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss UTC");

  return stakeEndTime ? (
    <TransactionConfirmField label={field.label}>
      <Text ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {stakeEndTime}
      </Text>
    </TransactionConfirmField>
  ) : null;
};

export const Warning = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction,
  recipientWording: string,
}) => {
  invariant(transaction.family === "avalanchepchain", "not an avalanchepchain family transaction");

  switch (transaction.mode) {
    case "delegate":
      return null;
    default:
      return (
        <WarnBox>
          <Trans i18nKey="TransactionConfirm.warning" values={{ recipientWording }} />
        </WarnBox>
      );
  }
};

export const Title = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "avalanchepchain", "not an avalanche transaction");

  return (
    <Info>
      <Trans i18nKey={`TransactionConfirm.titleWording.${transaction.mode}`} />
    </Info>
  );
};

const fieldComponents = {
  "avalanchepchain.validatorName": AvalancheValidatorNameField,
  "avalanchepchain.validatorAmount": AvalancheValidatorAmountField,
  "avalanchepchain.stakeStart": AvalancheStakeStartField,
  "avalanchepchain.stakeEnd": AvalancheStakeEndField,
};

export default {
  fieldComponents,
  warning: Warning,
  title: Title,
};
