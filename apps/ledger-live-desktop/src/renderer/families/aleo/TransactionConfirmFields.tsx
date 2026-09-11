import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import type { AleoFieldComponentProps } from "./types";

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

const ValidatorNameField = ({
  address,
  currency,
}: {
  address: string;
  currency: CryptoCurrency;
}) => {
  const { validators } = useAleoValidators(currency);
  const validatorName = validators.find(v => v.address === address)?.name;

  if (!validatorName) return null;

  return (
    <TransactionConfirmField
      label={<Trans i18nKey="aleo.bond.flow.steps.connectDevice.validatorLabel" />}
    >
      <FieldText>{validatorName}</FieldText>
    </TransactionConfirmField>
  );
};

const AddressField = ({ field, account, parentAccount, transaction }: AleoFieldComponentProps) => {
  if (field.type !== "address") return null;

  const isBondRecipient = field.label === "To" && transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC;

  return (
    <>
      <TransactionConfirmField label={field.label}>
        <FieldText>{field.address}</FieldText>
      </TransactionConfirmField>
      {isBondRecipient && (
        <ValidatorNameField
          address={field.address}
          currency={getMainAccount(account, parentAccount).currency}
        />
      )}
    </>
  );
};

export default {
  fieldComponents: {
    address: AddressField,
  },
};
