// @flow

import type { Currency } from "@ledgerhq/live-common/lib/types";

export type CurrencySettings = {
  confirmationsNb: number,
  exchange: ?*,
};

type Privacy = {
  biometricsType: ?string,
  biometricsEnabled: boolean,
};

type SetExchangePairs = (
  Array<{
    from: Currency,
    to: Currency,
    exchange: ?string,
  }>,
) => *;

export const setExchangePairsAction: SetExchangePairs = pairs => ({
  type: "SETTINGS_SET_PAIRS",
  pairs,
});

export const setPrivacy = (privacy: Privacy) => ({
  type: "SETTINGS_SET_PRIVACY",
  privacy,
});

export const disablePrivacy = () => ({
  type: "SETTINGS_DISABLE_PRIVACY",
});

export const setPrivacyBiometrics = (enabled: boolean) => ({
  type: "SETTINGS_SET_PRIVACY_BIOMETRICS",
  enabled,
});

export const setCountervalue = (counterValue: string) => ({
  type: "SETTINGS_SET_COUNTERVALUE",
  counterValue,
});

export const importSettings = (settings: *) => ({
  type: "SETTINGS_IMPORT",
  settings,
});

export const importDesktopSettings = (settings: *) => ({
  type: "SETTINGS_IMPORT_DESKTOP",
  settings,
});

export const setReportErrors = (reportErrorsEnabled: boolean) => ({
  type: "SETTINGS_SET_REPORT_ERRORS",
  reportErrorsEnabled,
});

export const setAnalytics = (analyticsEnabled: boolean) => ({
  type: "SETTINGS_SET_ANALYTICS",
  analyticsEnabled,
});

export const setReadOnlyMode = (enabled: boolean) => ({
  type: "SETTINGS_SET_READONLY_MODE",
  enabled,
});

export const setExperimentalUSBSupport = (enabled: boolean) => ({
  type: "SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT",
  enabled,
});

export const setOrderAccounts = (orderAccounts: string) => ({
  type: "SETTINGS_SET_ORDER_ACCOUNTS",
  orderAccounts,
});

export const setSelectedTimeRange = (selectedTimeRange: string) => ({
  type: "SETTINGS_SET_SELECTED_TIME_RANGE",
  payload: selectedTimeRange,
});

export const updateCurrencySettings = (
  ticker: string,
  patch: $Shape<CurrencySettings>,
) => ({
  type: "UPDATE_CURRENCY_SETTINGS",
  ticker,
  patch,
});

export const completeOnboarding = () => ({
  type: "SETTINGS_COMPLETE_ONBOARDING",
});
export const installAppFirstTime = (bool: boolean) => ({
  type: "SETTINGS_INSTALL_APP_FIRST_TIME",
  hasInstalledAnyApp: bool,
});

export const switchCountervalueFirst = () => ({
  type: "SETTINGS_SWITCH_COUNTERVALUE_FIRST",
});

export const setHideEmptyTokenAccounts = (hideEmptyTokenAccounts: boolean) => ({
  type: "SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS",
  hideEmptyTokenAccounts,
});

export const blacklistToken = (tokenId: string) => ({
  type: "BLACKLIST_TOKEN",
  payload: tokenId,
});

export const showToken = (tokenId: string) => ({
  type: "SHOW_TOKEN",
  payload: tokenId,
});

export const dismissBanner = (bannerId: string) => ({
  type: "SETTINGS_DISMISS_BANNER",
  payload: bannerId,
});

export const setAvailableUpdate = (enabled: boolean) => ({
  type: "SETTINGS_SET_AVAILABLE_UPDATE",
  enabled,
});
