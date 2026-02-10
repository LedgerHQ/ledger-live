export interface AppInstallConfig {
  appName: string;
  displayName: string;
  confirmationDescriptionKey?: string;
  successDescriptionKey?: string;
  analyticsName?: string;
}

/**
 * Allowlist of apps that can be installed via deep link.
 * Adding a new entry enables external URLs to trigger app installation.
 */
export const APP_INSTALL_MAP: Record<string, AppInstallConfig> = {
  // TODO: uncomment these when ready to use
  // example:
  // RecoveryKeyUpdater: {
  //   appName: "Recovery Key Updater",
  //   displayName: "Recovery Key Updater",
  //   confirmationDescriptionKey: "deeplinkInstallApp.confirmation.recoveryKeyDescription",
  //   successDescriptionKey: "deeplinkInstallApp.success.recoveryKeyDescription",
  //   analyticsName: "recovery_key_updater",
  // },
  Bitcoin: {
    appName: "Bitcoin",
    displayName: "Bitcoin",
    analyticsName: "bitcoin",
  },
};

export const getAppInstallConfig = (appKey: string): AppInstallConfig | null => {
  if (Object.prototype.hasOwnProperty.call(APP_INSTALL_MAP, appKey)) {
    return APP_INSTALL_MAP[appKey];
  }
  return null;
};

export const isValidInstallApp = (appKey: string): boolean => {
  return Object.prototype.hasOwnProperty.call(APP_INSTALL_MAP, appKey);
};
