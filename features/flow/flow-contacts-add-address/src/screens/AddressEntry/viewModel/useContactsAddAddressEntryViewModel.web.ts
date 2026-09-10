import { useCallback, type ChangeEvent, type ClipboardEvent } from "react";
import { getPastedValue } from "@features/platform-contacts";
import {
  resolveAddAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "../../../state/addAddressEntryPresentation";
import type {
  AddressLabelConfiguration,
  ContactsAddAddressEntryWebProps,
  ContactsAddAddressEntryWebViewProps,
} from "../components/ContactsAddAddressEntry/ContactsAddAddressEntry.types";
import { useTranslation } from "@shared/i18n";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";

function getAddressLabelConfiguration({
  addressLabel,
  onAddressLabelChange,
}: Partial<AddressLabelConfiguration>): AddressLabelConfiguration | undefined {
  return addressLabel && onAddressLabelChange ? { addressLabel, onAddressLabelChange } : undefined;
}

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  sanctionedAddressBanner,
  onAddressChange,
  onConfirm,
  ...addressLabelProps
}: ContactsAddAddressEntryWebProps): ContactsAddAddressEntryWebViewProps {
  const { t } = useTranslation();
  const labels = {
    title: t("contacts.addAddressEntry.title"),
    addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
    confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
    validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
    validAddress: t("contacts.addAddressEntry.validAddress"),
    invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
    domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
    sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
    validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
    ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
    ensDisclaimerDescription: t("contacts.addAddressEntry.ensDisclaimerDescription"),
  };
  const nameLabels = {
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
  const addressLabelConfiguration = getAddressLabelConfiguration(addressLabelProps);
  const presentation = resolveAddAddressEntryPresentation(addressEntry, labels);
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onAddressChange(event.target.value, "manual"),
    [onAddressChange],
  );
  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      onAddressChange(getPastedValue(addressEntry.value, event), "paste");
    },
    [addressEntry.value, onAddressChange],
  );
  const onNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      addressLabelConfiguration?.onAddressLabelChange(event.target.value),
    [addressLabelConfiguration],
  );
  const nameValidationMessage = addressLabelConfiguration?.addressLabel.validationError
    ? nameLabels.validationErrors[addressLabelConfiguration.addressLabel.validationError]
    : undefined;
  const isNameValid =
    addressLabelConfiguration === undefined ||
    addressLabelConfiguration.addressLabel.status === "valid";
  const showSanctionedAddressBanner = shouldShowSanctionedAddressBanner(
    addressEntry,
    sanctionedAddressBanner,
  );

  const addressLabelViewProps = addressLabelConfiguration
    ? {
        addressLabel: addressLabelConfiguration.addressLabel,
        nameLabels,
        nameValidationMessage,
        onAddressLabelChange: onNameChange,
      }
    : {};

  return {
    value: addressEntry.value,
    labels,
    ...presentation,
    sanctionedAddressBanner: showSanctionedAddressBanner ? sanctionedAddressBanner : undefined,
    ...addressLabelViewProps,
    isConfirmEnabled: presentation.isConfirmEnabled && isNameValid && onConfirm !== undefined,
    onChange,
    onPaste,
    onConfirm,
  };
}
