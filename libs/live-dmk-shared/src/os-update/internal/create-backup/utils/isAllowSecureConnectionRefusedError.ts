import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";

export function isAllowSecureConnectionRefusedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (
    error instanceof RefusedByUserDAError ||
    ("_tag" in error && error._tag === "RefusedByUserDAError")
  ) {
    return true;
  }

  // CommandResult / DeviceActionState / XState onError: { error: DmkError }
  if ("error" in error && error.error !== error) {
    return isAllowSecureConnectionRefusedError(error.error);
  }

  return false;
}
