import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { getPastedValue, resolveAddressInputPresentation } from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputSource,
} from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";

export function useEditAddressDialogPresentation({
  addressEntry,
  onAddressChange,
}: Readonly<{
  addressEntry: ContactsAddressEntryState;
  onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
}>) {
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

  return {
    value: addressEntry.value,
    ...presentation,
    onChange,
    onPaste,
  };
}
