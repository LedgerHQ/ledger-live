export type ContactDeviceIntentFailureJobState =
  /**
   * The kit's version guard refused the device. Which version it refused
   * depends on who serves the operation: an embedded coin app for the
   * app-owned intents, the device OS for the dashboard-owned ones (contact
   * rename). The kit reports both as one error, so each renderer supplies the
   * copy that matches its own intent.
   */
  | { readonly type: "app-version-too-low"; readonly error: Error }
  | { readonly type: "invalid-input"; readonly error: Error }
  /**
   * The user refused the prompt on the device. Which status word carries that
   * depends on who served the prompt, so both map here:
   *
   * - 0x5501 (`ActionRefusedError`), from the kit's *global* error table — the
   *   dashboard-owned operations, i.e. contact rename.
   * - 0x6A80 (SWO_INCORRECT_DATA), from the Contacts *app* error table — the
   *   app-owned operations, i.e. register and edit an external address. The app
   *   buckets malformed TLV and an invalid group handle under that same status
   *   word, so a refusal cannot be told apart from bad data there.
   *
   * The kit documents neither; both are confirmed against a device.
   */
  | { readonly type: "device-rejected"; readonly error: Error; readonly retry?: () => void }
  /** 0x6982 (SWO_SECURITY_CONDITION_NOT_SATISFIED): HMAC_PROOF/HMAC_REST verification failed — only reachable when replaying an existing group. */
  | { readonly type: "existing-group-verification-failed"; readonly error: Error }
  /** 0x6984 (SWO_CONDITIONS_NOT_SATISFIED): unknown sub-command or unsupported configuration. */
  | { readonly type: "unsupported-operation"; readonly error: Error }
  /**
   * Anything we cannot name: an unrecognised status word (0x6B00, ...), an
   * untyped kit error, a stopped device action, or a transport failure.
   */
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

/** Case-insensitively compares a `ContactsCommandError.errorCode` against a known status word. */
function isErrorCode(errorCode: unknown, code: string): boolean {
  return typeof errorCode === "string" && errorCode.toLowerCase() === code;
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
  // 0x5501, from the DMK's own GLOBAL_ERRORS table rather than the Contacts
  // app's: refusing the prompt is a device-level outcome, so it arrives tagged
  // by the kit's global handler and never reaches the app error table below.
  if (tag === "ActionRefusedError") {
    return { type: "device-rejected", error: mappedError };
  }
  if (tag === "ContactsCommandError") {
    const errorCode = (error as { errorCode?: unknown }).errorCode;
    if (isErrorCode(errorCode, "6a80")) {
      return { type: "device-rejected", error: mappedError };
    }
    if (isErrorCode(errorCode, "6982")) {
      return { type: "existing-group-verification-failed", error: mappedError };
    }
    if (isErrorCode(errorCode, "6984")) {
      return { type: "unsupported-operation", error: mappedError };
    }
    return { type: "failed", error: mappedError };
  }
  return { type: "failed", error: mappedError };
}
