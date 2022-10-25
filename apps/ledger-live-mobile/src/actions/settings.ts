import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelInfo, DeviceInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { PortfolioRange } from "@ledgerhq/types-live";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { selectedTimeRangeSelector } from "../reducers/settings";

export type CurrencySettings = {
  confirmationsNb: number;
  exchange: any | null | undefined;
};
type Privacy = {
  biometricsType: string | null | undefined;
  biometricsEnabled: boolean;
};
type SetExchangePairs = (
  _: Array<{
    from: Currency;
    to: Currency;
    exchange: string | null | undefined;
  }>,
) => any;
export type Theme = "system" | "light" | "dark";
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
export const importSettings = (settings: any) => ({
  type: "SETTINGS_IMPORT",
  settings,
});
export const importDesktopSettings = (settings: any) => ({
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
export const hideNftCollection = (collectionId: string) => ({
  type: "HIDE_NFT_COLLECTION",
  payload: collectionId,
});
export const unhideNftCollection = (collectionId: string) => ({
  type: "UNHIDE_NFT_COLLECTION",
  payload: collectionId,
});
export const dismissBanner = (bannerId: string) => ({
  type: "SETTINGS_DISMISS_BANNER",
  payload: bannerId,
});
export const setCarouselVisibility = (cardsVisibility: any) => ({
  type: "SETTINGS_SET_CAROUSEL_VISIBILITY",
  payload: cardsVisibility,
});
export const setAvailableUpdate = (enabled: boolean) => ({
  type: "SETTINGS_SET_AVAILABLE_UPDATE",
  enabled,
});
export const setTheme = (payload: Theme) => ({
  type: "SETTINGS_SET_THEME",
  payload,
});
export const setOsTheme = (payload: string) => ({
  type: "SETTINGS_SET_OS_THEME",
  payload,
});
export const setDiscreetMode = (payload: boolean) => ({
  type: "SETTINGS_SET_DISCREET_MODE",
  payload,
});
export const setLanguage = (payload: string) => ({
  type: "SETTINGS_SET_LANGUAGE",
  payload,
});
export const setLocale = (payload: string) => ({
  type: "SETTINGS_SET_LOCALE",
  payload,
});
export const setSwapSelectableCurrencies = (
  selectableCurrencies: string[],
) => ({
  type: "SET_SWAP_SELECTABLE_CURRENCIES",
  payload: selectableCurrencies,
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
export const swapAcceptProvider = (providerId: string) => ({
  type: "ACCEPT_SWAP_PROVIDER",
  payload: providerId,
});
export const setLastSeenDeviceInfo = (dmi: DeviceModelInfo) => ({
  type: "LAST_SEEN_DEVICE_INFO",
  payload: dmi,
});

export const setLastSeenDevice = ({
  deviceInfo,
}: {
  deviceInfo: DeviceInfo;
}) => ({
  type: "LAST_SEEN_DEVICE",
  payload: { deviceInfo },
});

export const addStarredMarketCoins = (payload: string) => ({
  type: "ADD_STARRED_MARKET_COINS",
  payload,
});
export const removeStarredMarketCoins = (payload: string) => ({
  type: "REMOVE_STARRED_MARKET_COINS",
  payload,
});
export const setLastConnectedDevice = (device: Device) => ({
  type: "SET_LAST_CONNECTED_DEVICE",
  payload: device,
});
export const setHasOrderedNano = (enabled: boolean) => ({
  type: "SET_HAS_ORDERED_NANO",
  enabled,
});
export const setMarketRequestParams = (
  marketRequestParams: MarketListRequestParams,
) => ({
  type: "SET_MARKET_REQUEST_PARAMS",
  payload: marketRequestParams,
});
export const setMarketCounterCurrency = (currency: string) => ({
  type: "SET_MARKET_COUNTER_CURRENCY",
  payload: currency,
});
export const setMarketFilterByStarredAccounts = (payload: boolean) => ({
  type: "SET_MARKET_FILTER_BY_STARRED_ACCOUNTS",
  payload,
});
export const setSensitiveAnalytics = (enabled: boolean) => ({
  type: "SET_SENSITIVE_ANALYTICS",
  enabled,
});
export const setFirstConnectionHasDevice = (payload?: boolean) => ({
  type: "SET_FIRST_CONNECTION_HAS_DEVICE",
  payload,
});
export const setNotifications = (payload: any) => ({
  type: "SET_NOTIFICATIONS",
  payload,
});
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
  const options = ranges.map<PortfolioRangeOption>(key => ({
    key,
    value: t(`common:time.${key}`),
    label: t(`common:time.${key}`),
  }));
  return [val, setter, options];
}
