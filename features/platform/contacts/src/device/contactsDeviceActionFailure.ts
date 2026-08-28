export type ContactDeviceIntentFailureJobState =
  | { readonly type: "app-version-too-low"; readonly error: Error }
  | { readonly type: "invalid-input"; readonly error: Error }
  /**
   * 0x6A80 (SWO_INCORRECT_DATA): malformed TLV, invalid group handle, or user
   * rejection — one bucket, by firmware design.
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
