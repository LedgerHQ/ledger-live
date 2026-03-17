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
  // Bitcoin: {
  //   appName: "Bitcoin",
  //   displayName: "Bitcoin",
  //   analyticsName: "bitcoin",
  // },
};

const validKeys = new Set(Object.keys(APP_INSTALL_MAP));

export const getAppInstallConfig = (appKey: string): AppInstallConfig | null => {
  return validKeys.has(appKey) ? APP_INSTALL_MAP[appKey] : null;
};

export const isValidInstallApp = (appKey: string): boolean => {
  return validKeys.has(appKey);
};
