import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "./errors";
import {
  ContactAddressLabelInputSchema,
  ContactNameInputSchema,
} from "./schema";
import type { ContactAddressLabel, ContactName } from "./types";

export type ContactNameValidationErrorName =
  typeof INVALID_CONTACT_NAME_ERROR_NAME;

export type ContactAddressLabelValidationErrorName =
  | typeof INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME
  | typeof DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME
  | typeof CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME;

type ContactNameValidationResult = {
  readonly validationError: ContactNameValidationErrorName | null;
  readonly value: ContactName | null;
};

type ContactAddressLabelValidationResult = {
  readonly validationError: ContactAddressLabelValidationErrorName | null;
  readonly value: ContactAddressLabel | null;
};

function validateContactNameInput(
  draftName: string
): ContactNameValidationResult {
  const parsed = ContactNameInputSchema.safeParse(draftName);

  if (!parsed.success) {
    return { validationError: INVALID_CONTACT_NAME_ERROR_NAME, value: null };
  }

  return parsed.data === ""
    ? { validationError: null, value: null }
    : { validationError: null, value: parsed.data };
}

export function getContactNameValidationError(
  draftName: string
): ContactNameValidationErrorName | null {
  return validateContactNameInput(draftName).validationError;
}

export function isValidContactName(draftName: string): boolean {
  const { validationError, value } = validateContactNameInput(draftName);

  return validationError === null && value !== null;
}

export function parseContactName(draftName: string): ContactName {
  const { validationError, value } = validateContactNameInput(draftName);

  if (validationError === INVALID_CONTACT_NAME_ERROR_NAME || value === null) {
    throw new InvalidContactNameError();
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
