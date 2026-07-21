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
