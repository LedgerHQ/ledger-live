import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  DuplicateContactNameError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";
import {
  ContactAddressLabelInputSchema,
  ContactNameInputSchema,
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

type ContactNameValidationResult = {
  readonly validationError: ContactNameValidationErrorName | null;
  readonly value: ContactName | null;
};

type ContactAddressLabelValidationResult = {
  readonly validationError: ContactAddressLabelValidationErrorName | null;
  readonly value: ContactAddressLabel | null;
};

function validateContactNameInput(
  draftName: string,
  existingNames: readonly ContactName[]
): ContactNameValidationResult {
  const parsed = ContactNameInputSchema.safeParse(draftName);

  if (!parsed.success) {
    return { validationError: INVALID_CONTACT_NAME_ERROR_NAME, value: null };
  }

  if (parsed.data === "") {
    return { validationError: null, value: null };
  }

  const validationError = existingNames.some(
    (name) =>
      normalizeContactNameForComparison(name) ===
      normalizeContactNameForComparison(parsed.data)
  )
    ? DUPLICATE_CONTACT_NAME_ERROR_NAME
    : null;

  return { validationError, value: parsed.data };
}

export function getContactNameValidationError(
  draftName: string,
  existingNames: readonly ContactName[] = []
): ContactNameValidationErrorName | null {
  return validateContactNameInput(draftName, existingNames).validationError;
}

export function isValidContactName(
  draftName: string,
  existingNames: readonly ContactName[] = []
): boolean {
  const { validationError, value } = validateContactNameInput(
    draftName,
    existingNames
  );

  return validationError === null && value !== null;
}

export function normalizeContactNameForComparison(name: string): string {
  return name.trim().normalize("NFC").toLocaleLowerCase("en-US");
}

export function parseContactName(
  draftName: string,
  existingNames: readonly ContactName[] = []
): ContactName {
  const { validationError, value } = validateContactNameInput(
    draftName,
    existingNames
  );

  if (validationError === INVALID_CONTACT_NAME_ERROR_NAME || value === null) {
    throw new InvalidContactNameError();
  }

  if (validationError === DUPLICATE_CONTACT_NAME_ERROR_NAME) {
    throw new DuplicateContactNameError();
  }

  return value;
}

export function normalizeContactAddressLabelForComparison(
  label: string
): string {
  return label.toLocaleLowerCase("en-US");
}

function validateContactAddressLabelInput(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[]
): ContactAddressLabelValidationResult {
  const parsed = ContactAddressLabelInputSchema.safeParse(draftLabel);

  if (!parsed.success) {
    const validationError = parsed.error.issues.some(
      (issue) => issue.message === CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME
    )
      ? CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME
      : INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME;

    return { validationError, value: null };
  }

  if (parsed.data === "") {
    return { validationError: null, value: null };
  }

  const comparisonLabel = normalizeContactAddressLabelForComparison(
    parsed.data
  );
  const validationError = existingLabels.some(
    (label) =>
      normalizeContactAddressLabelForComparison(label) === comparisonLabel
  )
    ? DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME
    : null;

  return { validationError, value: parsed.data };
}

export function getContactAddressLabelValidationError(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): ContactAddressLabelValidationErrorName | null {
  return validateContactAddressLabelInput(draftLabel, existingLabels)
    .validationError;
}

export function isValidContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): boolean {
  const { validationError, value } = validateContactAddressLabelInput(
    draftLabel,
    existingLabels
  );

  return validationError === null && value !== null;
}

export function parseContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = []
): ContactAddressLabel {
  const { validationError, value } = validateContactAddressLabelInput(
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

  if (value === null) {
    throw new InvalidContactAddressLabelError();
  }

  return value;
}
