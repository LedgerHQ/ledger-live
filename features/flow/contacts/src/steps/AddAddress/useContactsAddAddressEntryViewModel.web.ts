import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import type {
  ContactsAddAddressEntryWebProps,
  ContactsAddAddressEntryWebViewProps,
} from "./ContactsAddAddressEntry.web.types";

function getPastedValue(value: string, event: ClipboardEvent<HTMLInputElement>): string {
  const input = event.currentTarget;
  const pastedText = event.clipboardData.getData("text");
  const selectionStart = input.selectionStart ?? value.length;
  const selectionEnd = input.selectionEnd ?? value.length;

  return `${value.slice(0, selectionStart)}${pastedText}${value.slice(selectionEnd)}`;
}

function resolveAddressInputPresentation(
  addressEntry: ContactsAddAddressEntryWebProps["addressEntry"],
  labels: ContactsAddAddressEntryWebProps["labels"],
): Pick<
  ContactsAddAddressEntryWebViewProps,
  "inputStatus" | "helperText" | "showEnsDisclaimer" | "isConfirmEnabled"
> {
  switch (addressEntry.status) {
    case "empty":
      return { showEnsDisclaimer: false, isConfirmEnabled: false };
    case "validating":
      return {
        helperText: labels.validatingAddress,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "valid":
      return {
        inputStatus: "success",
        helperText: labels.validAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: true,
      };
    case "invalid":
      return {
        inputStatus: "error",
        helperText:
          addressEntry.error === "domain_not_found" ? labels.domainNotFound : labels.invalidAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: false,
      };
    case "unavailable":
      return {
        inputStatus: "error",
        helperText: labels.validationUnavailable,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
  }
}

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  labels,
  onAddressChange,
  onConfirm,
}: ContactsAddAddressEntryWebProps): ContactsAddAddressEntryWebViewProps {
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
    labels,
    ...presentation,
    isConfirmEnabled: presentation.isConfirmEnabled && onConfirm !== undefined,
    onChange,
    onPaste,
    onConfirm,
  };
}
