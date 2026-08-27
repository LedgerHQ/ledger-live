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

/**
 * Raised when an external-address edit changes the entry's scope. The Contacts
 * kit has no scope-edit method yet (DSDK-1380), and the scope is bound into the
 * address-level `hmacRest`, so changing it host-side would invalidate the
 * stored proof.
 */
export class ContactDeviceIntentScopeEditUnsupportedError extends Error {
  override name = "ContactDeviceIntentScopeEditUnsupportedError" as const;

  constructor() {
    super("Editing an external address scope is not supported by the device yet");
  }
}
