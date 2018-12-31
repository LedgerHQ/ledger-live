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

export const setDeveloperMode = (developerModeEnabled: boolean) => ({
  type: "SETTINGS_SET_DEVELOPER_MODE",
  developerModeEnabled,
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
  currencyId: number,
  patch: $Shape<CurrencySettings>,
) => ({
  type: "UPDATE_CURRENCY_SETTINGS",
  currencyId,
  patch,
});

export const completeOnboarding = () => ({
  type: "SETTINGS_COMPLETE_ONBOARDING",
});
export const acceptTradingWarning = () => ({
  type: "SETTINGS_ACCEPT_TRADING_WARNING",
});
export const installAnyApp = () => ({
  type: "SETTINGS_INSTALL_ANY_APP",
});
