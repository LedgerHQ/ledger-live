import { getContactAddressLabelValidationError } from "@domain/entity-contact";
import type { ContactAddressLabel } from "@domain/entity-contact";
import type { RenameAddressViewModel } from "../types";

export function createRenameAddressViewModel(
  draftLabel: string,
  currentLabel: string,
  existingLabels: readonly ContactAddressLabel[],
): RenameAddressViewModel {
  const trimmedDraftLabel = draftLabel.trim();
  const invalidLabelError = getContactAddressLabelValidationError(draftLabel, existingLabels);
  const hasChanged = trimmedDraftLabel !== currentLabel.trim();

  return {
    draftLabel,
    invalidLabelError,
    isConfirmEnabled: hasChanged && trimmedDraftLabel.length > 0 && invalidLabelError === null,
  };
}
