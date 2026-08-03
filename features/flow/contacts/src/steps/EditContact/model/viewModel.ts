import { getContactNameValidationError } from "@domain/entity-contact";
import type { RenameContactViewModel } from "../types";

export function createRenameContactViewModel(
  draftName: string,
  currentName: string,
): RenameContactViewModel {
  const trimmedDraftName = draftName.trim();
  const invalidNameError = getContactNameValidationError(draftName);
  const hasChanged = trimmedDraftName !== currentName.trim();

  return {
    draftName,
    invalidNameError,
    isConfirmEnabled: hasChanged && trimmedDraftName.length > 0 && invalidNameError === null,
  };
}
