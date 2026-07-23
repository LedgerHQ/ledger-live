import {
  INVALID_CONTACT_NAME_ERROR_NAME,
  InvalidContactNameError,
  type ContactNameValidationErrorName,
} from "./errors";
import { ContactNameSchema } from "./schema";
import type { ContactName } from "./types";

export function getContactNameValidationError(
  draftName: string,
): ContactNameValidationErrorName | null {
  const trimmedDraftName = draftName.trim();

  if (trimmedDraftName.length === 0) {
    return null;
  }

  return ContactNameSchema.safeParse(trimmedDraftName).success
    ? null
    : INVALID_CONTACT_NAME_ERROR_NAME;
}

export function isValidContactName(draftName: string): boolean {
  return draftName.trim().length > 0 && getContactNameValidationError(draftName) === null;
}

export function parseContactName(draftName: string): ContactName {
  const parsed = ContactNameSchema.safeParse(draftName.trim());

  if (!parsed.success) {
    throw new InvalidContactNameError();
  }

  return parsed.data;
}
