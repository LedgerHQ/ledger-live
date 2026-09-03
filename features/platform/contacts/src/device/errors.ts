export class ContactDeviceIntentCancelledError extends Error {
  override name = "ContactDeviceIntentCancelledError" as const;

  constructor() {
    super("The Contacts device intent was cancelled");
  }
}

export class ContactDeviceIntentMissingResultError extends Error {
  override name = "ContactDeviceIntentMissingResultError" as const;

  constructor() {
    super("The Contacts device intent completed without a result");
  }
}

export class ContactDeviceIntentInputError extends Error {
  override name = "ContactDeviceIntentInputError" as const;
}
