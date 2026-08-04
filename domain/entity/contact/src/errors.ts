export const INVALID_CONTACT_NAME_ERROR_NAME = "InvalidContactNameError";
export const INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "InvalidContactAddressLabelError";
export const DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME =
  "DuplicateContactAddressLabelError";
export const CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME =
  "ContactAddressLabelTooLongError";

export class ContactError extends Error {
  override name: string = "ContactError";
}

export class InvalidContactNameError extends ContactError {
  override name = INVALID_CONTACT_NAME_ERROR_NAME;

  constructor() {
    super("Expected letters, spaces, apostrophes, or hyphens");
  }
}

export class InvalidContactAddressLabelError extends ContactError {
  override name = INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME;
}

export class DuplicateContactAddressLabelError extends ContactError {
  override name = DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME;
}

export class ContactAddressLabelTooLongError extends ContactError {
  override name = CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME;
}
