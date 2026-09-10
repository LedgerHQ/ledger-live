import { useCallback, useMemo } from "react";
import {
  classifyNativeAddressInputMethod,
  resolveAddressInputPresentation,
} from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputSource,
} from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { EditAddressAddressEntryPresentation } from "./types";

export function useEditAddressAddressEntryPresentation({
  addressEntry,
  onAddressChange,
}: Readonly<{
  addressEntry: ContactsAddressEntryState;
  onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
}>): EditAddressAddressEntryPresentation {
  const { t } = useTranslation();
  const labels = useMemo(
    () => ({
      validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
      domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
      sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
      validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
    }),
    [t],
  );
  const presentation = useMemo(
    () => resolveAddressInputPresentation(addressEntry, labels),
    [addressEntry, labels],
  );
  const onChangeText = useCallback(
    (value: string) => {
      onAddressChange(value, classifyNativeAddressInputMethod(addressEntry.value, value));
    },
    [addressEntry.value, onAddressChange],
  );

  return {
    value: addressEntry.value,
    inputStatus: presentation.inputStatus,
    helperText: presentation.helperText,
    showEnsDisclaimer: presentation.showEnsDisclaimer,
    onChangeText,
  };
}
