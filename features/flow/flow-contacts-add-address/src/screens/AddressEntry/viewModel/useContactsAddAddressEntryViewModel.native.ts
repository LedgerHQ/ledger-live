import { useCallback } from "react";
import {
  resolveAddAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "../../../state/addAddressEntryPresentation";
import type {
  ContactsAddAddressEntryProps,
  ContactsAddAddressEntryViewProps,
} from "../components/ContactsAddAddressEntry/ContactsAddAddressEntry.types";
import { classifyNativeAddressInputMethod } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  sanctionedAddressBanner,
  bottomOffset = 0,
  onChangeText,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryProps): ContactsAddAddressEntryViewProps {
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
  const presentation = resolveAddAddressEntryPresentation(addressEntry, labels);
  const showSanctionedAddressBanner = shouldShowSanctionedAddressBanner(
    addressEntry,
    sanctionedAddressBanner,
  );
  const onAddressChange = useCallback(
    (value: string) => {
      onChangeText(value, classifyNativeAddressInputMethod(addressEntry.value, value));
    },
    [addressEntry.value, onChangeText],
  );

  return {
    value: addressEntry.value,
    labels,
    bottomOffset,
    bottomPadding: 32,
    inputStatus: presentation.inputStatus,
    helperText: showSanctionedAddressBanner ? undefined : presentation.helperText,
    sanctionedAddressBanner: showSanctionedAddressBanner ? sanctionedAddressBanner : undefined,
    showEnsDisclaimer: presentation.showEnsDisclaimer,
    isConfirmEnabled: presentation.isConfirmEnabled,
    onAddressChange,
    onConfirm,
    onQrCodeClick,
  };
}
