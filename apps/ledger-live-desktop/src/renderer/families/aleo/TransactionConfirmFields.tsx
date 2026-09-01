import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import type { FieldComponentProps } from "~/renderer/components/TransactionConfirm";

const FieldText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "neutral.c80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
`;

const AddressField = ({ field, account, parentAccount }: FieldComponentProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { validators } = useAleoValidators(mainAccount.currency);

  if (field.type !== "address") return null;

  const validatorName =
    field.label === "To" ? (validators.find(v => v.address === field.address)?.name ?? null) : null;

  return (
    <>
      <TransactionConfirmField label={field.label}>
        <FieldText>{field.address}</FieldText>
      </TransactionConfirmField>
      {validatorName && (
        <TransactionConfirmField
          label={<Trans i18nKey="aleo.bond.flow.steps.connectDevice.validatorLabel" />}
        >
          <FieldText>{validatorName}</FieldText>
        </TransactionConfirmField>
      )}
    </>
  );
};

export default {
  fieldComponents: {
    address: AddressField,
  },
};
