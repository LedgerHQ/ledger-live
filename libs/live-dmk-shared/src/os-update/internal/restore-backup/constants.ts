export const ENGLISH_LANGUAGE_ID = 0;

/** Shares of the restore, summing to 1. */
export const RESTORE_LANGUAGE_WEIGHT = 0.1;
export const RESTORE_APPS_WEIGHT = 0.7;
export const RESTORE_CLS_WEIGHT = 0.2;

export const RestoreBackupStepValue = {
  RequestMasterConsent: "requestMasterConsent",
  InstallLanguagePackage: "installLanguagePackage",
  InstallOrUpdateApps: "installOrUpdateApps",
  RestoreAppsStorage: "restoreAppsStorage",
  UploadCustomLockScreen: "uploadCustomLockScreen",
} as const;
