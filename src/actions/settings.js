// @flow

import type { Currency } from "@ledgerhq/live-common/lib/types";

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

export const setAuthSecurity = (authSecurityEnabled: boolean) => ({
  type: "SETTINGS_SET_AUTH_SECURITY",
  authSecurityEnabled,
});

export const setCountervalue = (counterValue: string) => ({
  type: "SETTINGS_SET_COUNTERVALUE",
  counterValue,
});

export const importSettings = (settings: *) => ({
  type: "SETTINGS_IMPORT",
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
