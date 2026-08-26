/**
 * Shared failure taxonomy for Contacts device intents, mapped from the
 * kit's typed DeviceAction errors so the UI can switch on `jobState.type`
 * instead of parsing an `Error`.
 *
 * Grounded in the Address Book firmware spec's status-word table (only
 * 5 codes exist for the whole feature: 0x9000, 0x6A80, 0x6982, 0x6984,
 * 0x6B00) and the kit's own pre-APDU guards (`ContactsValidationError`,
 * `ContactsVersionRequirementError`). Every other status word the kit's
 * error table lists isn't in the firmware spec and falls into
 * `device-error` rather than a name we can't actually back.
 */
export type ContactDeviceIntentFailureJobState =
  | { readonly type: "app-version-too-low"; readonly error: Error }
  | { readonly type: "invalid-input"; readonly error: Error }
  /** 0x6A80 (SWO_INCORRECT_DATA): malformed TLV, invalid group handle, or user rejection — one bucket, by firmware design. */
  | { readonly type: "device-rejected"; readonly error: Error }
  /** 0x6982 (SWO_SECURITY_CONDITION_NOT_SATISFIED): HMAC_PROOF/HMAC_REST verification failed — only reachable when replaying an existing group. */
  | { readonly type: "existing-group-verification-failed"; readonly error: Error }
  /** 0x6984 (SWO_CONDITIONS_NOT_SATISFIED): unknown sub-command or unsupported configuration. */
  | { readonly type: "unsupported-operation"; readonly error: Error }
  /** Any other typed kit error (0x6B00, UnknownDAError, open-app command errors, ...). */
  | { readonly type: "device-error"; readonly error: Error }
  /** Untyped/unexpected failure that never reached a typed DeviceActionState.Error (e.g. a transport disconnect). */
  | { readonly type: "failed"; readonly error: Error };

/** Convert any of the kit's DmkError/DeviceExchangeError shapes into a proper `Error`. */
export function mapDmkErrorToError(error: unknown): Error {
  if (error instanceof Error) return error;

  const candidate = error as { message?: unknown; originalError?: unknown; _tag?: unknown };
  if (typeof candidate.message === "string") return new Error(candidate.message);
  if (candidate.originalError instanceof Error) return candidate.originalError;
  return new Error(
    typeof candidate._tag === "string" ? candidate._tag : "Contacts device intent failed",
  );
}

/**
 * Map a Contacts DeviceAction's typed error (the kit never throws; failures
 * are typed `DAError`s) onto the shared failure taxonomy above.
 */
export function mapDeviceActionErrorToFailureJobState(
  error: unknown,
): ContactDeviceIntentFailureJobState {
  const mappedError = mapDmkErrorToError(error);
  const tag = (error as { _tag?: unknown })._tag;

  if (tag === "ContactsVersionRequirementError") {
    return { type: "app-version-too-low", error: mappedError };
  }
  if (tag === "ContactsValidationError") {
    return { type: "invalid-input", error: mappedError };
  }
  if (tag === "ContactsCommandError") {
    const errorCode = (error as { errorCode?: unknown }).errorCode;
    switch (errorCode) {
      case "6a80":
        return { type: "device-rejected", error: mappedError };
      case "6982":
        return { type: "existing-group-verification-failed", error: mappedError };
      case "6984":
        return { type: "unsupported-operation", error: mappedError };
      default:
        return { type: "device-error", error: mappedError };
    }
  }
  return { type: "device-error", error: mappedError };
}
