import {
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  DuplicateContactAddressLabelError,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
  type ContactAddressLabelValidationErrorName,
  type ContactNameValidationErrorName,
} from "./errors";
import { ContactAddressLabelSchema, ContactNameSchema } from "./schema";
import type { ContactAddressLabel, ContactName } from "./types";

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

export function normalizeContactAddressLabelForComparison(label: string): string {
  return label.trim().normalize("NFC").toLocaleLowerCase("en-US");
}

export function getContactAddressLabelValidationError(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = [],
): ContactAddressLabelValidationErrorName | null {
  const parsed = ContactAddressLabelSchema.safeParse(draftLabel);

  if (!parsed.success) {
    return draftLabel.trim().length === 0 ? null : INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME;
  }

  const comparisonLabel = normalizeContactAddressLabelForComparison(parsed.data);
  return existingLabels.some(
    label => normalizeContactAddressLabelForComparison(label) === comparisonLabel,
  )
    ? DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME
    : null;
}

export function isValidContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = [],
): boolean {
  return (
    draftLabel.trim().length > 0 &&
    getContactAddressLabelValidationError(draftLabel, existingLabels) === null
  );
}

export function parseContactAddressLabel(
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[] = [],
): ContactAddressLabel {
  const parsed = ContactAddressLabelSchema.safeParse(draftLabel);

  if (!parsed.success) {
    throw new InvalidContactAddressLabelError();
  }

  if (getContactAddressLabelValidationError(parsed.data, existingLabels) !== null) {
    throw new DuplicateContactAddressLabelError();
  }

  return ContactAddressLabelSchema.parse(parsed.data.normalize("NFC"));
}
