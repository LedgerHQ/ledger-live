import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Dispatch, Action } from "redux";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  PortfolioRange,
  DeviceModelInfo,
  FeatureId,
  Feature,
  DeviceInfo,
} from "@ledgerhq/types-live";
import { setEnvOnAllThreads } from "~/helpers/env";
import {
  SettingsState as Settings,
  hideEmptyTokenAccountsSelector,
  filterTokenOperationsZeroAmountSelector,
  selectedTimeRangeSelector,
  SettingsState,
  VaultSigner,
  SupportedCountervaluesData,
  CurrencySettings,
  doNotAskAgainSkipMemoSelector,
} from "~/renderer/reducers/settings";
import { useRefreshAccountsOrdering } from "~/renderer/actions/general";
import { Language, Locale } from "~/config/languages";
import {
  PURGE_EXPIRED_ANONYMOUS_USER_NOTIFICATIONS,
  TOGGLE_MEMOTAG_INFO,
  TOGGLE_MEV,
  UPDATE_ANONYMOUS_USER_NOTIFICATIONS,
} from "./constants";
export type SaveSettings = (a: Partial<Settings>) => {
  type: string;
  payload: Partial<Settings>;
};
export const saveSettings: SaveSettings = payload => ({
  type: "SAVE_SETTINGS",
  payload,
});
export const setCountervalueFirst = (countervalueFirst: boolean) =>
  saveSettings({
    countervalueFirst,
  });
export const setAccountsViewMode = (accountsViewMode: "list" | "card" | undefined) =>
  saveSettings({
    accountsViewMode,
  });
export const setSelectedTimeRange = (selectedTimeRange: PortfolioRange) =>
  saveSettings({
    selectedTimeRange,
  });
export const setDeveloperMode = (developerMode: boolean) =>
  saveSettings({
    developerMode,
  });
export const setDiscreetMode = (discreetMode: boolean) =>
  saveSettings({
    discreetMode,
  });
export const setSentryLogs = (sentryLogs: boolean) =>
  saveSettings({
    sentryLogs,
  });
export const setShareAnalytics = (shareAnalytics: boolean) =>
  saveSettings({
    shareAnalytics,
  });
export const setSharePersonalizedRecommendations = (sharePersonalizedRecommandations: boolean) =>
  saveSettings({
    sharePersonalizedRecommandations,
  });
export const setAutoLockTimeout = (autoLockTimeout: number) =>
  saveSettings({
    autoLockTimeout,
  });
export const setHasInstalledApps = (hasInstalledApps: boolean) =>
  saveSettings({
    hasInstalledApps,
  });

// developer
export const setAllowDebugApps = (allowDebugApps: boolean) =>
  saveSettings({
    allowDebugApps,
  });

export const setAllowDebugReactQuery = (allowReactQueryDebug: boolean) =>
  saveSettings({
    allowReactQueryDebug,
  });
export const setAllowExperimentalApps = (allowExperimentalApps: boolean) =>
  saveSettings({
    allowExperimentalApps,
  });

export const setEnablePlatformDevTools = (enablePlatformDevTools: boolean) =>
  saveSettings({
    enablePlatformDevTools,
  });
export const setEnableLearnPageStagingUrl = (enableLearnPageStagingUrl: boolean) =>
  saveSettings({
    enableLearnPageStagingUrl,
  });
export const setCounterValue = (counterValue: string) =>
  saveSettings({
    counterValue,
    pairExchanges: {},
  });
export const setLanguage = (language?: Language | null) =>
  saveSettings({
    language,
  });
export const setTheme = (theme?: string | null) =>
  saveSettings({
    theme,
  });
export const setLocale = (locale: Locale) =>
  saveSettings({
    locale,
  });
export const setUSBTroubleshootingIndex = (USBTroubleshootingIndex?: number) =>
  saveSettings({
    USBTroubleshootingIndex,
  });
export function useHideEmptyTokenAccounts(): [boolean, (hideEmptyTokenAccounts: boolean) => void] {
  const dispatch = useDispatch();
  const value = useSelector(hideEmptyTokenAccountsSelector);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  const setter = useCallback(
    (hideEmptyTokenAccounts: boolean) => {
      if (setEnvOnAllThreads("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccounts)) {
        dispatch(
          saveSettings({
            hideEmptyTokenAccounts,
          }),
        );
        refreshAccountsOrdering();
      }
    },
    [dispatch, refreshAccountsOrdering],
  );
  return [value, setter];
}
export function useFilterTokenOperationsZeroAmount(): [
  boolean,
  (filterTokenOperationsZeroAmount: boolean) => void,
] {
  const dispatch = useDispatch();
  const value = useSelector(filterTokenOperationsZeroAmountSelector);
  const setter = useCallback(
    (filterTokenOperationsZeroAmount: boolean) => {
      if (setEnvOnAllThreads("FILTER_ZERO_AMOUNT_ERC20_EVENTS", filterTokenOperationsZeroAmount)) {
        dispatch(
          saveSettings({
            filterTokenOperationsZeroAmount,
          }),
        );
      }
    },
    [dispatch],
  );
  return [value, setter];
}
export function useDoNotAskAgainSkipMemo(): [boolean, (doNotAskAgainSkipMemo: boolean) => void] {
  const dispatch = useDispatch();
  const value = useSelector(doNotAskAgainSkipMemoSelector);
  const setter = useCallback(
    (doNotAskAgainSkipMemo: boolean) => {
      dispatch(
        saveSettings({
          doNotAskAgainSkipMemo,
        }),
      );
    },
    [dispatch],
  );
  return [value, setter];
}
export type PortfolioRangeOption = {
  key: PortfolioRange;
  value: string;
  label: string;
};
export function useTimeRange(): [
  PortfolioRange,
  (range: PortfolioRangeOption | PortfolioRange) => void,
  PortfolioRangeOption[],
] {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const val = useSelector(selectedTimeRangeSelector);
  const setter = useCallback(
    (_range: PortfolioRange | PortfolioRangeOption) => {
      const range = typeof _range === "string" ? _range : _range.key;
      dispatch(setSelectedTimeRange(range));
    },
    [dispatch],
  );
  const ranges: PortfolioRange[] = ["day", "week", "month", "year", "all"];
  const options: PortfolioRangeOption[] = ranges.map(key => ({
    key,
    value: t(`time.range.${key}`),
    label: t(`time.range.${key}`),
  }));
  return [val, setter, options];
}

export const setShowClearCacheBanner = (showClearCacheBanner: boolean) =>
  saveSettings({
    showClearCacheBanner,
  });
export const setSidebarCollapsed = (sidebarCollapsed: boolean) =>
  saveSettings({
    sidebarCollapsed,
  });
export const blacklistToken = (tokenId: string) => ({
  type: "BLACKLIST_TOKEN",
  payload: tokenId,
});

export const setLastSeenCustomImage = (lastSeenCustomImage: {
  imageSize: number;
  imageHash: string;
}) => ({
  type: "SET_LAST_SEEN_CUSTOM_IMAGE",
  payload: {
    imageSize: lastSeenCustomImage.imageSize,
    imageHash: lastSeenCustomImage.imageHash,
  },
});
export const clearLastSeenCustomImage = () => ({
  type: "SET_LAST_SEEN_CUSTOM_IMAGE",
  payload: {
    imageSize: 0,
    imageHash: "",
  },
});
export const showToken = (tokenId: string) => ({
  type: "SHOW_TOKEN",
  payload: tokenId,
});

type FetchSettings = (a: SettingsState) => (a: Dispatch<Action<"FETCH_SETTINGS">>) => void;
export const fetchSettings: FetchSettings = (settings: SettingsState) => dispatch => {
  dispatch({
    type: "FETCH_SETTINGS",
    payload: settings,
  });
};

export const dismissBanner = (bannerKey: string) => ({
  type: "SETTINGS_DISMISS_BANNER",
  payload: bannerKey,
});
export const setPreferredDeviceModel = (preferredDeviceModel: DeviceModelId) =>
  saveSettings({
    preferredDeviceModel,
  });
export const setLastSeenDeviceInfo = ({
  lastSeenDevice,
  latestFirmware,
}: {
  lastSeenDevice: DeviceModelInfo;
  latestFirmware: unknown;
}) => ({
  type: "LAST_SEEN_DEVICE_INFO",
  payload: {
    lastSeenDevice,
    latestFirmware,
  },
});
export const setLastSeenDevice = ({ deviceInfo }: { deviceInfo: DeviceInfo }) => ({
  type: "LAST_SEEN_DEVICE",
  payload: {
    deviceInfo,
  },
});

export const addNewDeviceModel = ({ deviceModelId }: { deviceModelId: DeviceModelId }) => ({
  type: "ADD_NEW_DEVICE_MODEL",
  payload: deviceModelId,
});
export const setDeepLinkUrl = (url?: string | null) => ({
  type: "SET_DEEPLINK_URL",
  payload: url,
});
export const setOverriddenFeatureFlag = (featureFlag: {
  key: FeatureId;
  value: Feature | undefined;
}) => ({
  type: "SET_OVERRIDDEN_FEATURE_FLAG",
  payload: {
    key: featureFlag.key,
    value: featureFlag.value,
  },
});
export const setOverriddenFeatureFlags = (
  overriddenFeatureFlags: Partial<{
    [key in FeatureId]: Feature;
  }>,
) => ({
  type: "SET_OVERRIDDEN_FEATURE_FLAGS",
  payload: {
    overriddenFeatureFlags,
  },
});
export const setFeatureFlagsButtonVisible = (featureFlagsButtonVisible: boolean) => ({
  type: "SET_FEATURE_FLAGS_BUTTON_VISIBLE",
  payload: {
    featureFlagsButtonVisible,
  },
});

export const setVaultSigner = (payload: VaultSigner) => ({
  type: "SET_VAULT_SIGNER",
  payload,
});

export const setSupportedCounterValues = (payload: SupportedCountervaluesData[]) => ({
  type: "SET_SUPPORTED_COUNTER_VALUES",
  payload,
});

export const setHasSeenAnalyticsOptInPrompt = (hasSeenAnalyticsOptInPrompt: boolean) => ({
  type: "SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT",
  payload: hasSeenAnalyticsOptInPrompt,
});

export const setDismissedContentCards = (payload: { id: string; timestamp: number }) => ({
  type: "SET_DISMISSED_CONTENT_CARDS",
  payload,
});

export const clearDismissedContentCards = (payload: { now: Date }) => ({
  type: "CLEAR_DISMISSED_CONTENT_CARDS",
  payload,
});

export const setAnonymousBrazeId = (payload: string) => ({
  type: "SET_ANONYMOUS_BRAZE_ID",
  payload,
});

export const setCurrencySettings = (payload: { key: string; value: CurrencySettings }) => ({
  type: "SET_CURRENCY_SETTINGS",
  payload,
});

export const addStarredMarketCoins = (payload: string) => ({
  type: "MARKET_ADD_STARRED_COINS",
  payload,
});

export const removeStarredMarketCoins = (payload: string) => ({
  type: "MARKET_REMOVE_STARRED_COINS",
  payload,
});

export const setHasBeenUpsoldRecover = (payload: boolean) => ({
  type: "SET_HAS_BEEN_UPSOLD_RECOVER",
  payload,
});

export const setOnboardingUseCase = (payload: Settings["onboardingUseCase"]) => ({
  type: "SET_ONBOARDING_USE_CASE",
  payload,
});

export const setHasRedirectedToPostOnboarding = (payload: boolean) => ({
  type: "SET_HAS_REDIRECTED_TO_POST_ONBOARDING",
  payload,
});

export const setLastOnboardedDevice = (payload: Device | null) => ({
  type: "SET_LAST_ONBOARDED_DEVICE",
  payload,
});
export const setMevProtection = (payload: boolean) => ({
  type: TOGGLE_MEV,
  payload,
});

export const toggleShouldDisplayMemoTagInfo = (payload: boolean) => {
  return {
    type: TOGGLE_MEMOTAG_INFO,
    payload,
  };
};

export const purgeExpiredAnonymousUserNotifications = (payload: { now: Date }) => {
  return {
    type: PURGE_EXPIRED_ANONYMOUS_USER_NOTIFICATIONS,
    payload,
  };
};

export const updateAnonymousUserNotifications = (payload: {
  notifications: SettingsState["anonymousUserNotifications"];
}) => {
  return {
    type: UPDATE_ANONYMOUS_USER_NOTIFICATIONS,
    payload,
  };
};

export const setHasSeenWalletV4Tour = (hasSeenWalletV4Tour: boolean) => ({
  type: "SET_HAS_SEEN_WALLET_V4_TOUR",
  payload: hasSeenWalletV4Tour,
});
