import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { resolveAddressInputPresentation } from "../AddAddress/model/addressInputPresentation";
import type { AddAddressEntryState, AddAddressInputSource } from "../AddAddress/types";
import { getPastedValue } from "../../utils/getPastedValue.web";
import type { ContactsEditAddressValidationLabels } from "./types";

export function useEditAddressDialogPresentation({
  addressEntry,
  labels,
  onAddressChange,
}: Readonly<{
  addressEntry: AddAddressEntryState;
  labels: ContactsEditAddressValidationLabels;
  onAddressChange: (value: string, inputMethod: AddAddressInputSource) => void;
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
