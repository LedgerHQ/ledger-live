import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";

export function isRefusedByUserError(error: unknown): boolean {
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
    return isRefusedByUserError(error.error);
  }

  return false;
}

export function isAllowSecureConnectionRefusedError(error: unknown): boolean {
  return isRefusedByUserError(error);
}

export function isAllowInstallFirmwareRefusedError(error: unknown): boolean {
  return isRefusedByUserError(error);
}
