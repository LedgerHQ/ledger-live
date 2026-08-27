import { useCallback, useMemo } from "react";
import {
  classifyNativeAddressInputMethod,
  resolveAddressInputPresentation,
} from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputSource,
} from "@features/platform-contacts";
import type {
  ContactsEditAddressValidationLabels,
  EditAddressAddressEntryPresentation,
} from "./types";

export function useEditAddressAddressEntryPresentation({
  addressEntry,
  labels,
  onAddressChange,
}: Readonly<{
  addressEntry: ContactsAddressEntryState;
  labels: ContactsEditAddressValidationLabels;
  onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
}>): EditAddressAddressEntryPresentation {
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
