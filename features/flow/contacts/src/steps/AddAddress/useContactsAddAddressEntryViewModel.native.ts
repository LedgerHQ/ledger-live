import { useCallback } from "react";
import {
  resolveAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "./model/addressInputPresentation";
import type {
  ContactsAddAddressEntryProps,
  ContactsAddAddressEntryViewProps,
} from "./ContactsAddAddressEntry.types";
import { classifyNativeAddressInputMethod } from "../../utils/classifyNativeAddressInputMethod";

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  labels,
  sanctionedAddressBanner,
  bottomOffset = 0,
  onChangeText,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryProps): ContactsAddAddressEntryViewProps {
  const presentation = resolveAddressEntryPresentation(addressEntry, labels);
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
