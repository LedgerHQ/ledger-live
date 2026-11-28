import type { DeviceBackup } from "@domain/entity-device-os-update";
import { ENGLISH_LANGUAGE_ID } from "../state-machines/restore-backup/constants";

export const hasAnythingToRestore = (backup: DeviceBackup | undefined): boolean => {
  if (backup === undefined) {
    return false;
  }

  const hasNonEnglishLanguage =
    backup.languageId !== undefined && backup.languageId !== ENGLISH_LANGUAGE_ID;
  const hasApps = backup.installedApps.length > 0;
  const hasCustomLockScreen = backup.clsHexImage !== undefined;

  return hasNonEnglishLanguage || hasApps || hasCustomLockScreen;
};
