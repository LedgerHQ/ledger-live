import { isRefusedByUserError } from "@features/platform-device-kit";

export function isAllowSecureConnectionRefusedError(error: unknown): boolean {
  return isRefusedByUserError(error);
}

export function isAllowInstallFirmwareRefusedError(error: unknown): boolean {
  return isRefusedByUserError(error);
}
