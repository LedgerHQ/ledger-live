/**
 * Matched on its tag rather than with an `instanceof`: the DMK build re-exports `OutOfMemoryDAError`
 * under a mangled name, so the class cannot be imported.
 */
export function isOutOfMemoryError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("_tag" in error && error._tag === "OutOfMemoryDAError") {
    return true;
  }

  // CommandResult / DeviceActionState / XState onError: { error: DmkError }
  if ("error" in error && error.error !== error) {
    return isOutOfMemoryError(error.error);
  }

  return false;
}
