// @flow
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import RecipientAddress from "~/renderer/components/RecipientAddress";
import invariant from "invariant";
import type { Account, Transaction, TransactionStatus } from "@ledgerhq/live-common/types/index";
import {
  ValidatorAddressRequired,
  NewValidatorAddressRequired,
  OldValidatorAddressRequired,
} from "@ledgerhq/live-common/errors";

const ValidatorAddressField = ({
  onChange,
  account,
  transaction,
  status,
  addressType,
  autoFocus = true,
}: {
  onChange: string => void,
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  addressType: string,
  autoFocus?: boolean,
}) => {
  const { t } = useTranslation();
  invariant(transaction.family === "helium", "validatorAddress: helium family expected");

  const onValidatorValueChange = useCallback(
    validatorAddress => {
      onChange(validatorAddress);
    },
    [onChange],
  );

  const getValidatorAddress = useCallback(() => {
    if (addressType === "validator") {
      return transaction.model.validatorAddress || "";
    } else if (addressType === "oldAddress") {
      return transaction.model.oldValidatorAddress || "";
    } else if (addressType === "newAddress") {
      return transaction.model.newValidatorAddress || "";
    }
  }, [transaction, addressType]);

  const {
    validatorAddress: validatorError,
    newValidatorAddress: newValidatorError,
    oldValidatorAddress: oldValidatorError,
  } = status.errors;

  const getValidatorAddressError = useCallback(() => {
    if (addressType === "validator") {
      return validatorError instanceof ValidatorAddressRequired ? null : validatorError;
    } else if (addressType === "oldAddress") {
      return newValidatorError instanceof NewValidatorAddressRequired ? null : newValidatorError;
    } else if (addressType === "newAddress") {
      return oldValidatorError instanceof OldValidatorAddressRequired ? null : oldValidatorError;
    }
  }, [addressType, validatorError, newValidatorError, oldValidatorError]);

  return (
    <RecipientAddress
      placeholder={t("families.helium.addressPlaceholder")}
      autoFocus={autoFocus}
      withQrCode={true}
      readOnly={false}
      error={getValidatorAddressError()}
      value={getValidatorAddress()}
      onChange={onValidatorValueChange}
      id={"validator-address-input"}
    />
  );
};

export default ValidatorAddressField;
