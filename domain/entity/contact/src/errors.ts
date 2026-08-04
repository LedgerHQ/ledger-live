export class ContactError extends Error {
  override name: string = "ContactError";
}

export class InvalidContactNameError extends ContactError {
  override name = "InvalidContactNameError" as const;

  constructor() {
    super("Expected letters, spaces, apostrophes, or hyphens");
  }
}

export class InvalidContactAddressLabelError extends ContactError {
  override name = "InvalidContactAddressLabelError" as const;
}

export class DuplicateContactAddressLabelError extends ContactError {
  override name = "DuplicateContactAddressLabelError" as const;
}

export class ContactAddressLabelTooLongError extends ContactError {
  override name = "ContactAddressLabelTooLongError" as const;
}
