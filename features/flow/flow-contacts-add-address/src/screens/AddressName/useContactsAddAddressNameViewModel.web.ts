import { useCallback, type ChangeEvent } from "react";
import type { ContactsAddAddressNameProps, ContactsAddAddressNameViewProps } from "./types";
import { useTranslation } from "@shared/i18n";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";

export function useContactsAddAddressNameViewModel({
  addressEntry,
  addressLabel,
  showConfirmedAddress = true,
  onAddressLabelChange,
  onContinue,
}: ContactsAddAddressNameProps): ContactsAddAddressNameViewProps {
  const { t } = useTranslation();
  const labels = {
    inputLabel: t("contacts.addAddressName.inputLabel"),
    namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
    namingDisclaimerAccessibilityLabel: t(
      "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
    ),
    continueToReview: t("contacts.addAddressName.continueToReview"),
    validAddress: t("contacts.addAddressEntry.validAddress"),
    validationErrors: {
      [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
      [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
      [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
    },
  };
  const validationMessage = addressLabel.validationError
    ? labels.validationErrors[addressLabel.validationError]
    : undefined;
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onAddressLabelChange(event.target.value),
    [onAddressLabelChange],
  );

  return {
    address: addressEntry.value,
    addressLabel,
    labels,
    showConfirmedAddress,
    validationMessage,
    isContinueEnabled: addressLabel.status === "valid",
    onAddressLabelChange: onChange,
    onContinue,
  };
}
