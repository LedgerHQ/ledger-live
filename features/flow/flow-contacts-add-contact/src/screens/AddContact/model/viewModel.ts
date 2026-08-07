import { getContactNameValidationError, type ContactName } from "@domain/entity-contact";
import { getNameInitial } from "@shared/name";
import type { AddContactViewModel } from "./types";

export function createAddContactViewModel(
  draftName: string,
  existingNames: readonly ContactName[] = [],
): AddContactViewModel {
  const trimmedDraftName = draftName.trim();
  const invalidNameError = getContactNameValidationError(draftName, existingNames);

  return {
    draftName,
    avatarInitial: getNameInitial(trimmedDraftName),
    invalidNameError,
    isSaveEnabled: trimmedDraftName.length > 0 && invalidNameError === null,
  };
}
