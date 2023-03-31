import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/devices";
import { PortfolioRange } from "@ledgerhq/live-common/portfolio/v2/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelInfo, FeatureId, Feature } from "@ledgerhq/types-live";
import { setEnvOnAllThreads } from "~/helpers/env";
import {
  SettingsState as Settings,
  hideEmptyTokenAccountsSelector,
  filterTokenOperationsZeroAmountSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useRefreshAccountsOrdering } from "~/renderer/actions/general";
export type SaveSettings = (
  a: Partial<Settings>,
) => {
  type: string;
  payload: Partial<Settings>;
};
export const saveSettings: SaveSettings = payload => ({
  type: "DB:SAVE_SETTINGS",
  payload,
});
export const setCountervalueFirst = (countervalueFirst: boolean) =>
  saveSettings({
    countervalueFirst,
  });
export const setAccountsViewMode = (accountsViewMode: any) =>
  saveSettings({
    accountsViewMode,
  });
export const setNftsViewMode = (nftsViewMode: any) =>
  saveSettings({
    nftsViewMode,
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
export const setCarouselVisibility = (carouselVisibility: number) =>
  saveSettings({
    carouselVisibility,
  });
export const setSentryLogs = (sentryLogs: boolean) =>
  saveSettings({
    sentryLogs,
  });
export const setFullNodeEnabled = (fullNodeEnabled: boolean) =>
  saveSettings({
    fullNodeEnabled,
  });
export const setShareAnalytics = (shareAnalytics: boolean) =>
  saveSettings({
    shareAnalytics,
  });
export const setAutoLockTimeout = (autoLockTimeout: any) =>
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
export const setAllowExperimentalApps = (allowExperimentalApps: boolean) =>
  saveSettings({
    allowExperimentalApps,
  });
export const setEnablePlatformDevTools = (enablePlatformDevTools: boolean) =>
  saveSettings({
    enablePlatformDevTools,
  });
export const setCatalogProvider = (catalogProvider: string) =>
  saveSettings({
    catalogProvider,
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
export const setLanguage = (language?: string | null) =>
  saveSettings({
    language,
  });
export const setTheme = (theme?: string | null) =>
  saveSettings({
    theme,
  });
export const setLocale = (locale: string) =>
  saveSettings({
    locale,
  });
export const setUSBTroubleshootingIndex = (USBTroubleshootingIndex?: number) =>
  saveSettings({
    USBTroubleshootingIndex,
  });
export function useHideEmptyTokenAccounts() {
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
export function useFilterTokenOperationsZeroAmount() {
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
type PortfolioRangeOption = {
  key: PortfolioRange;
  value: string;
  label: string;
};
export function useTimeRange() {
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
export const hideNftCollection = (collectionId: string) => ({
  type: "HIDE_NFT_COLLECTION",
  payload: collectionId,
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
export const swapAcceptProvider = (providerId: string) => ({
  type: "ACCEPT_SWAP_PROVIDER",
  payload: providerId,
});
export const showToken = (tokenId: string) => ({
  type: "SHOW_TOKEN",
  payload: tokenId,
});
export const unhideNftCollection = (collectionId: string) => ({
  type: "UNHIDE_NFT_COLLECTION",
  payload: collectionId,
});
type FetchSettings = (a: any) => (a: Dispatch<any>) => void;
export const fetchSettings: FetchSettings = (settings: any) => dispatch => {
  dispatch({
    type: "FETCH_SETTINGS",
    payload: settings,
  });
};
type SetExchangePairs = (
  a: Array<{
    from: Currency;
    to: Currency;
    exchange: string | undefined | null;
  }>,
) => any;
export const setExchangePairsAction: SetExchangePairs = pairs => ({
  type: "SETTINGS_SET_PAIRS",
  pairs,
});
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
  latestFirmware: any;
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
export const setDeepLinkUrl = (url?: string | null) => ({
  type: "SET_DEEPLINK_URL",
  payload: url,
});
export const setFirstTimeLend = () => ({
  type: "SET_FIRST_TIME_LEND",
});
export const setSwapSelectableCurrencies = (selectableCurrencies: string[]) => ({
  type: "SET_SWAP_SELECTABLE_CURRENCIES",
  payload: selectableCurrencies,
});
export const setSwapHasAcceptedIPSharing = (hasAcceptedIPSharing: boolean) => ({
  type: "SET_SWAP_ACCEPTED_IP_SHARING",
  payload: hasAcceptedIPSharing,
});
export const setSwapKYCStatus = (payload: {
  provider: string;
  id?: string;
  status?: string | null;
}) => ({
  type: "SET_SWAP_KYC",
  payload,
});
export const resetSwapLoginAndKYCData = () => ({
  type: "RESET_SWAP_LOGIN_AND_KYC_DATA",
});
export const addStarredMarketCoins = (payload: string) => ({
  type: "ADD_STARRED_MARKET_COINS",
  payload,
});
export const removeStarredMarketCoins = (payload: string) => ({
  type: "REMOVE_STARRED_MARKET_COINS",
  payload,
});
export const toggleStarredMarketCoins = (payload: string) => ({
  type: "TOGGLE_STARRED_MARKET_COINS",
  payload,
});
export const setOverriddenFeatureFlag = (key: FeatureId, value: Feature | undefined) => ({
  type: "SET_OVERRIDDEN_FEATURE_FLAG",
  payload: {
    key,
    value,
  },
});
export const setOverriddenFeatureFlags = (overriddenFeatureFlags: {
  [key: FeatureId]: Feature;
}) => ({
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
