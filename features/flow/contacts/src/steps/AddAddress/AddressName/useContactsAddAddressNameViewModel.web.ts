import { useCallback, useMemo, type ChangeEvent } from "react";
import type { ContactsAddAddressNameProps, ContactsAddAddressNameViewProps } from "./types";

export function useContactsAddAddressNameViewModel({
  addressLabel,
  labels,
  onAddressLabelChange,
  onContinue,
}: ContactsAddAddressNameProps): ContactsAddAddressNameViewProps {
  const validationMessage = useMemo(
    () =>
      addressLabel.validationError
        ? labels.validationErrors[addressLabel.validationError]
        : undefined,
    [addressLabel.validationError, labels.validationErrors],
  );
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onAddressLabelChange(event.target.value),
    [onAddressLabelChange],
  );

  return {
    addressLabel,
    labels,
    validationMessage,
    isContinueEnabled: addressLabel.status === "valid",
    onAddressLabelChange: onChange,
    onContinue,
  };
}
