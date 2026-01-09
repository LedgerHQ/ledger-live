export interface AppInstallConfig {
  appName: string;
  displayName: string;
  confirmationDescriptionKey?: string;
  successDescriptionKey?: string;
  analyticsName?: string;
}

export const APP_INSTALL_MAP: Record<string, AppInstallConfig> = {
  RecoveryKeyUpdater: {
    appName: "Recovery Key Updater",
    displayName: "Recovery Key Updater",
    confirmationDescriptionKey: "deeplinkInstallApp.confirmation.recoveryKeyDescription",
    successDescriptionKey: "deeplinkInstallApp.success.recoveryKeyDescription",
    analyticsName: "recovery_key_updater",
  },
  Bitcoin: {
    appName: "Bitcoin",
    displayName: "Bitcoin",
    analyticsName: "bitcoin",
  },
};

export const getAppInstallConfig = (appKey: string): AppInstallConfig | undefined => {
  return APP_INSTALL_MAP[appKey];
};

export const isValidInstallApp = (appKey: string): boolean => {
  return appKey in APP_INSTALL_MAP;
};
