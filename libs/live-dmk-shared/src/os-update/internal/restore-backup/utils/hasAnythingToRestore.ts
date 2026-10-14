import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import { ENGLISH_LANGUAGE_ID } from "../constants";

export const hasAnythingToRestore = (backup: Backup | undefined): boolean => {
  if (backup === undefined) {
    return false;
  }

  const hasNonEnglishLanguage =
    backup.languageId !== undefined && backup.languageId !== ENGLISH_LANGUAGE_ID;
  const hasApps = backup.installedApps.length > 0;
  const hasCustomLockScreen = backup.clsHexImage !== undefined;

  return hasNonEnglishLanguage || hasApps || hasCustomLockScreen;
};
