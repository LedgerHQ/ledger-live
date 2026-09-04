import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { getPastedValue, resolveAddressInputPresentation } from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputSource,
} from "@features/platform-contacts";
import type { ContactsEditAddressValidationLabels } from "./types";

export function useEditAddressDialogPresentation({
  addressEntry,
  labels,
  onAddressChange,
}: Readonly<{
  addressEntry: ContactsAddressEntryState;
  labels: ContactsEditAddressValidationLabels;
  onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
}>) {
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
