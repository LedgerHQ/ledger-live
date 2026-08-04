import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  DuplicateContactNameError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  ContactAddressLabelSchema,
  ContactNameSchema,
} from "./schema";
import type { ContactAddressLabel, ContactName } from "./types";

export type ContactNameValidationErrorName =
  | InvalidContactNameError["name"]
  | DuplicateContactNameError["name"];

export const INVALID_CONTACT_NAME_ERROR_NAME =
  "InvalidContactNameError" satisfies ContactNameValidationErrorName;

export const DUPLICATE_CONTACT_NAME_ERROR_NAME =
  "DuplicateContactNameError" satisfies ContactNameValidationErrorName;

export type ContactAddressLabelValidationErrorName =
  | InvalidContactAddressLabelError["name"]
  | DuplicateContactAddressLabelError["name"]
  | ContactAddressLabelTooLongError["name"];

export const INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "InvalidContactAddressLabelError" satisfies ContactAddressLabelValidationErrorName;

export const DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "DuplicateContactAddressLabelError" satisfies ContactAddressLabelValidationErrorName;

export const CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME =
  "ContactAddressLabelTooLongError" satisfies ContactAddressLabelValidationErrorName;

export function getContactNameValidationError(
  draftName: string,
  existingNames: readonly ContactName[] = []
): ContactNameValidationErrorName | null {
  const trimmedDraftName = draftName.trim();

  if (trimmedDraftName.length === 0) {
    return null;
  }

  const parsed = ContactNameSchema.safeParse(trimmedDraftName);

  if (!parsed.success) {
    return INVALID_CONTACT_NAME_ERROR_NAME;
  }

  const comparisonName = normalizeContactNameForComparison(parsed.data);
  return existingNames.some(
    (name) => normalizeContactNameForComparison(name) === comparisonName
  )
    ? DUPLICATE_CONTACT_NAME_ERROR_NAME
    : null;
}

export function isValidContactName(
  draftName: string,
  existingNames: readonly ContactName[] = []
): boolean {
  return (
    draftName.trim().length > 0 &&
    getContactNameValidationError(draftName, existingNames) === null
  );
}

export function normalizeContactNameForComparison(name: string): string {
  return name.trim().normalize("NFC").toLocaleLowerCase("en-US");
}

export function parseContactName(
  draftName: string,
  existingNames: readonly ContactName[] = []
): ContactName {
  const validationError = getContactNameValidationError(
    draftName,
    existingNames
  );

  if (validationError === INVALID_CONTACT_NAME_ERROR_NAME) {
    throw new InvalidContactNameError();
  }

  if (validationError === DUPLICATE_CONTACT_NAME_ERROR_NAME) {
    throw new DuplicateContactNameError();
  }

  const parsed = ContactNameSchema.safeParse(draftName.trim());

  if (!parsed.success) {
    throw new InvalidContactNameError();
  }

  return ContactNameSchema.parse(parsed.data.normalize("NFC"));
}

export function normalizeContactAddressLabelForComparison(
  label: string
): string {
  return label.trim().normalize("NFC").toLocaleLowerCase("en-US");
}

export function getContactAddressLabelValidationError(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): ContactAddressLabelValidationErrorName | null {
  const trimmedDraftLabel = draftLabel.trim();

  if (trimmedDraftLabel.length > CONTACT_ADDRESS_LABEL_MAX_LENGTH) {
    return CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME;
  }

  const parsed = ContactAddressLabelSchema.safeParse(trimmedDraftLabel);

  if (!parsed.success) {
    return trimmedDraftLabel.length === 0
      ? null
      : INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME;
  }

  const comparisonLabel = normalizeContactAddressLabelForComparison(
    parsed.data
  );
  return existingLabels.some(
    (label) =>
      normalizeContactAddressLabelForComparison(label) === comparisonLabel
  )
    ? DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME
    : null;
}

export function isValidContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): boolean {
  return (
    draftLabel.trim().length > 0 &&
    getContactAddressLabelValidationError(draftLabel, existingLabels) === null
  );
}

export function parseContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): ContactAddressLabel {
  const validationError = getContactAddressLabelValidationError(
    draftLabel,
    existingLabels
  );

  if (validationError === CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME) {
    throw new ContactAddressLabelTooLongError();
  }

  if (validationError === INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME) {
    throw new InvalidContactAddressLabelError();
  }

  if (validationError === DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME) {
    throw new DuplicateContactAddressLabelError();
  }

  const parsed = ContactAddressLabelSchema.safeParse(draftLabel.trim());

  if (!parsed.success) {
    throw new InvalidContactAddressLabelError();
  }

  return ContactAddressLabelSchema.parse(parsed.data.normalize("NFC"));
}
