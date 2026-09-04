import { getContactAddressLabelValidationError } from "@domain/entity-contact";
import type { ContactAddress, ContactAddressLabel } from "@domain/entity-contact";
import type { ContactsAddressEntryState } from "@features/platform-contacts";
import type { RenameAddressViewModel } from "../types";

export function createRenameAddressViewModel(
  draftLabel: string,
  currentLabel: string,
  currentAddress: ContactAddress["address"] | undefined,
  addressEntry: ContactsAddressEntryState,
  existingLabels: readonly ContactAddressLabel[],
): RenameAddressViewModel {
  const trimmedDraftLabel = draftLabel.trim();
  const invalidLabelError = getContactAddressLabelValidationError(draftLabel, existingLabels);
  const labelValid = trimmedDraftLabel.length > 0 && invalidLabelError === null;
  const addressValid = addressEntry.status === "valid";
  const labelChanged = trimmedDraftLabel !== currentLabel.trim();
  const addressChanged =
    currentAddress !== undefined &&
    addressEntry.status === "valid" &&
    addressEntry.resolvedAddress !== currentAddress;
  const hasChanged = labelChanged || addressChanged;

  return {
    draftLabel,
    invalidLabelError,
    isConfirmEnabled: hasChanged && labelValid && addressValid,
  };
}
