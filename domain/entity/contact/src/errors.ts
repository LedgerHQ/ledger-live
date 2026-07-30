export class ContactError extends Error {
  override name = "ContactError";
}

export class InvalidContactNameError extends ContactError {
  override name = "InvalidContactNameError";

  constructor() {
    super("Expected letters, spaces, apostrophes, or hyphens");
  }
}

export type ContactNameValidationErrorName = "InvalidContactNameError";

export const INVALID_CONTACT_NAME_ERROR_NAME =
  "InvalidContactNameError" satisfies ContactNameValidationErrorName;

export class InvalidContactAddressLabelError extends ContactError {
  override name = "InvalidContactAddressLabelError";

  constructor() {
    super("Expected at least one letter or number; punctuation and spaces are also allowed");
  }
}

export class DuplicateContactAddressLabelError extends ContactError {
  override name = "DuplicateContactAddressLabelError";

  constructor() {
    super("Expected a unique address label for the contact");
  }
}

export type ContactAddressLabelValidationErrorName =
  | "InvalidContactAddressLabelError"
  | "DuplicateContactAddressLabelError";

export const INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "InvalidContactAddressLabelError" satisfies ContactAddressLabelValidationErrorName;

export const DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "DuplicateContactAddressLabelError" satisfies ContactAddressLabelValidationErrorName;
