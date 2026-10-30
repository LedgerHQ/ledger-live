import { useCallback } from "react";
import { classifyNativeAddressInputMethod } from "@features/platform-contacts";
import { useAddAddressEntryCopy } from "../../../copy/useAddAddressEntryCopy";
import {
  resolveAddAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "../../../state/addAddressEntryPresentation";
import type { ContactsAddAddressEntryProps } from "../components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import type { ContactsAddAddressEntryViewProps } from "../components/ContactsAddAddressEntryView/ContactsAddAddressEntryView";

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  supportsDomain,
  onSanctionedAddressLearnMore,
  bottomOffset = 0,
  onChangeText,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryProps): ContactsAddAddressEntryViewProps {
  const { labels, sanctionedDescription, sanctionedLearnMore } =
    useAddAddressEntryCopy(supportsDomain);
  const presentation = resolveAddAddressEntryPresentation(addressEntry, labels);
  const showSanctionedAddressBanner = shouldShowSanctionedAddressBanner(
    addressEntry,
    onSanctionedAddressLearnMore !== undefined,
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
    sanctionedAddressBanner:
      showSanctionedAddressBanner && onSanctionedAddressLearnMore
        ? {
            description: sanctionedDescription,
            actionLabel: sanctionedLearnMore,
            onAction: onSanctionedAddressLearnMore,
          }
        : undefined,
    showEnsDisclaimer: presentation.showEnsDisclaimer,
    isConfirmEnabled: presentation.isConfirmEnabled,
    onAddressChange,
    onConfirm,
    onQrCodeClick,
  };
}
