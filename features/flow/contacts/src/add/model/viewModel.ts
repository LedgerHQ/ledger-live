import { getContactNameValidationError } from "@domain/entity-contact";
import { getContactInitial } from "../../internals";
import type { AddContactViewModel } from "./types";

export function createAddContactViewModel(draftName: string): AddContactViewModel {
  const trimmedDraftName = draftName.trim();
  const invalidNameError = getContactNameValidationError(draftName);

  return {
    draftName,
    avatarInitial: getContactInitial(trimmedDraftName),
    invalidNameError,
    isSaveEnabled: trimmedDraftName.length > 0 && invalidNameError === null,
  };
}
