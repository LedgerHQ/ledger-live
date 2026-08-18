import { useCallback, useMemo } from "react";
import { resolveAddressInputPresentation } from "../AddAddress/model/addressInputPresentation";
import type { AddAddressEntryState, AddAddressInputSource } from "../AddAddress/types";
import { classifyNativeAddressInputMethod } from "../../utils/classifyNativeAddressInputMethod";
import type {
  ContactsEditAddressValidationLabels,
  EditAddressAddressEntryPresentation,
} from "./types";

export function useEditAddressAddressEntryPresentation({
  addressEntry,
  labels,
  onAddressChange,
}: Readonly<{
  addressEntry: AddAddressEntryState;
  labels: ContactsEditAddressValidationLabels;
  onAddressChange: (value: string, inputMethod: AddAddressInputSource) => void;
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
