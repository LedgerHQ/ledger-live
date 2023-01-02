import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createAction } from "redux-actions";
import { useDispatch, useSelector } from "react-redux";
import {
  DeviceModelInfo,
  DeviceInfo,
  FeatureId,
  Feature,
} from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { PortfolioRange } from "@ledgerhq/types-live";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { selectedTimeRangeSelector } from "../reducers/settings";
import type {
  CurrencySettings,
  Pair,
  Privacy,
  SettingsState,
  State,
  Theme,
} from "../reducers/types";
import {
  SettingsAcceptSwapProviderPayload,
  SettingsAddStarredMarketcoinsPayload,
  SettingsBlacklistTokenPayload,
  SettingsDangerouslyOverrideStatePayload,
  SettingsDismissBannerPayload,
  SettingsHideEmptyTokenAccountsPayload,
  SettingsHideNftCollectionPayload,
  SettingsImportDesktopPayload,
  SettingsImportPayload,
  SettingsInstallAppFirstTimePayload,
  SettingsLastSeenDeviceInfoPayload,
  SettingsLastSeenDevicePayload,
  SettingsRemoveStarredMarketcoinsPayload,
  SettingsSetAnalyticsPayload,
  SettingsSetAvailableUpdatePayload,
  SettingsSetCarouselVisibilityPayload,
  SettingsSetLastSeenCustomImagePayload,
  SettingsSetCountervaluePayload,
  SettingsSetDiscreetModePayload,
  SettingsSetFirstConnectionHasDevicePayload,
  SettingsSetHasOrderedNanoPayload,
  SettingsSetLanguagePayload,
  SettingsSetLastConnectedDevicePayload,
  SettingsSetLocalePayload,
  SettingsSetCustomImageBackupPayload,
  SettingsSetMarketCounterCurrencyPayload,
  SettingsSetMarketFilterByStarredAccountsPayload,
  SettingsSetMarketRequestParamsPayload,
  SettingsSetNotificationsPayload,
  SettingsSetOrderAccountsPayload,
  SettingsSetOsThemePayload,
  SettingsSetPairsPayload,
  SettingsSetPrivacyBiometricsPayload,
  SettingsSetPrivacyPayload,
  SettingsSetReadOnlyModePayload,
  SettingsSetReportErrorsPayload,
  SettingsSetSelectedTimeRangePayload,
  SettingsSetSensitiveAnalyticsPayload,
  SettingsSetSwapKycPayload,
  SettingsSetSwapSelectableCurrenciesPayload,
  SettingsSetThemePayload,
  SettingsShowTokenPayload,
  SettingsUnhideNftCollectionPayload,
  SettingsUpdateCurrencyPayload,
  SettingsActionTypes,
  SettingsSetWalletTabNavigatorLastVisitedTabPayload,
  SettingsSetDismissedDynamicCardsPayload,
  SettingsSetOverriddenFeatureFlagPlayload,
  SettingsSetOverriddenFeatureFlagsPlayload,
  SettingsSetFeatureFlagsBannerVisiblePayload,
} from "./types";
import { WalletTabNavigatorStackParamList } from "../components/RootNavigator/types/WalletTabNavigator";

// FIXME: NEVER USED BY ANYONE, DROP ?
const setExchangePairsAction = createAction<SettingsSetPairsPayload>(
  SettingsActionTypes.SETTINGS_SET_PAIRS,
);
export const setExchangePairs = (pairs: Array<Pair>) =>
  setExchangePairsAction({
    pairs,
  });

const setPrivacyAction = createAction<SettingsSetPrivacyPayload>(
  SettingsActionTypes.SETTINGS_SET_PRIVACY,
);
export const setPrivacy = (privacy: Privacy) =>
  setPrivacyAction({
    privacy,
  });

const disablePrivacyAction = createAction(
  SettingsActionTypes.SETTINGS_DISABLE_PRIVACY,
);
export const disablePrivacy = () => disablePrivacyAction();

const setPrivacyBiometricsAction =
  createAction<SettingsSetPrivacyBiometricsPayload>(
    SettingsActionTypes.SETTINGS_SET_PRIVACY_BIOMETRICS,
  );
export const setPrivacyBiometrics = (biometricsEnabled: boolean) =>
  setPrivacyBiometricsAction({
    biometricsEnabled,
  });

const setCountervalueAction = createAction<SettingsSetCountervaluePayload>(
  SettingsActionTypes.SETTINGS_SET_COUNTERVALUE,
);
export const setCountervalue = (counterValue: string) =>
  setCountervalueAction({
    counterValue,
  });

const importSettingsAction = createAction<SettingsImportPayload>(
  SettingsActionTypes.SETTINGS_IMPORT,
);
export const importSettings = (settings: Partial<SettingsState>) =>
  importSettingsAction(settings);

const importDesktopSettingsAction = createAction<SettingsImportDesktopPayload>(
  SettingsActionTypes.SETTINGS_IMPORT_DESKTOP,
);
export const importDesktopSettings = (settings: SettingsImportDesktopPayload) =>
  importDesktopSettingsAction(settings);

const setReportErrorsAction = createAction<SettingsSetReportErrorsPayload>(
  SettingsActionTypes.SETTINGS_SET_REPORT_ERRORS,
);
export const setReportErrors = (reportErrorsEnabled: boolean) =>
  setReportErrorsAction({
    reportErrorsEnabled,
  });

const setAnalyticsAction = createAction<SettingsSetAnalyticsPayload>(
  SettingsActionTypes.SETTINGS_SET_ANALYTICS,
);
export const setAnalytics = (analyticsEnabled: boolean) =>
  setAnalyticsAction({
    analyticsEnabled,
  });

const setReadOnlyAction = createAction<SettingsSetReadOnlyModePayload>(
  SettingsActionTypes.SETTINGS_SET_READONLY_MODE,
);
export const setReadOnlyMode = (readOnlyModeEnabled: boolean) =>
  setReadOnlyAction({
    readOnlyModeEnabled,
  });

const setOrderAccountsAction = createAction<SettingsSetOrderAccountsPayload>(
  SettingsActionTypes.SETTINGS_SET_ORDER_ACCOUNTS,
);
export const setOrderAccounts = (orderAccounts: string) =>
  setOrderAccountsAction({
    orderAccounts,
  });

const setSelectedTimeRangeAction =
  createAction<SettingsSetSelectedTimeRangePayload>(
    SettingsActionTypes.SETTINGS_SET_SELECTED_TIME_RANGE,
  );
export const setSelectedTimeRange = (selectedTimeRange: PortfolioRange) =>
  setSelectedTimeRangeAction({
    selectedTimeRange,
  });

const updateCurrencySettingsAction =
  createAction<SettingsUpdateCurrencyPayload>(
    SettingsActionTypes.UPDATE_CURRENCY_SETTINGS,
  );
export const updateCurrencySettings = (
  ticker: string,
  patch: Partial<CurrencySettings>,
) =>
  updateCurrencySettingsAction({
    ticker,
    patch,
  });

const completeCustomImageFlowAction = createAction(
  SettingsActionTypes.SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW,
);
export const completeCustomImageFlow = () => completeCustomImageFlowAction();

const setLastSeenCustomImageAction =
  createAction<SettingsSetLastSeenCustomImagePayload>(
    SettingsActionTypes.SET_LAST_SEEN_CUSTOM_IMAGE,
  );
export const setLastSeenCustomImage = ({
  imageSize,
  imageHash,
}: SettingsSetLastSeenCustomImagePayload) =>
  setLastSeenCustomImageAction({ imageSize, imageHash });
export const clearLastSeenCustomImage = () =>
  setLastSeenCustomImageAction({ imageSize: 0, imageHash: "" });

const completeOnboardingAction = createAction(
  SettingsActionTypes.SETTINGS_COMPLETE_ONBOARDING,
);
export const completeOnboarding = () => completeOnboardingAction();

const installAppFirstTimeAction =
  createAction<SettingsInstallAppFirstTimePayload>(
    SettingsActionTypes.SETTINGS_INSTALL_APP_FIRST_TIME,
  );
export const installAppFirstTime = (hasInstalledAnyApp: boolean) =>
  installAppFirstTimeAction({
    hasInstalledAnyApp,
  });

const switchCountervalueFirstAction = createAction(
  SettingsActionTypes.SETTINGS_SWITCH_COUNTERVALUE_FIRST,
);
export const switchCountervalueFirst = () => switchCountervalueFirstAction();

const setHideEmptyTokenAccountsAction =
  createAction<SettingsHideEmptyTokenAccountsPayload>(
    SettingsActionTypes.SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS,
  );
export const setHideEmptyTokenAccounts = (hideEmptyTokenAccounts: boolean) =>
  setHideEmptyTokenAccountsAction({
    hideEmptyTokenAccounts,
  });

const blacklistTokenAction = createAction<SettingsBlacklistTokenPayload>(
  SettingsActionTypes.BLACKLIST_TOKEN,
);
export const blacklistToken = (tokenId: string) =>
  blacklistTokenAction({
    tokenId,
  });

const showTokenAction = createAction<SettingsShowTokenPayload>(
  SettingsActionTypes.SHOW_TOKEN,
);
export const showToken = (tokenId: string) =>
  showTokenAction({
    tokenId,
  });

const hideNftCollectionAction = createAction<SettingsHideNftCollectionPayload>(
  SettingsActionTypes.HIDE_NFT_COLLECTION,
);
export const hideNftCollection = (collectionId: string) =>
  hideNftCollectionAction({
    collectionId,
  });

const unhideNftCollectionAction =
  createAction<SettingsUnhideNftCollectionPayload>(
    SettingsActionTypes.UNHIDE_NFT_COLLECTION,
  );
export const unhideNftCollection = (collectionId: string) =>
  unhideNftCollectionAction({
    collectionId,
  });

const dismissBannerAction = createAction<SettingsDismissBannerPayload>(
  SettingsActionTypes.SETTINGS_DISMISS_BANNER,
);
export const dismissBanner = (bannerId: string) =>
  dismissBannerAction({
    bannerId,
  });

const setCarouselVisibilityAction =
  createAction<SettingsSetCarouselVisibilityPayload>(
    SettingsActionTypes.SETTINGS_SET_CAROUSEL_VISIBILITY,
  );
export const setCarouselVisibility = (carouselVisibility: {
  [key: string]: boolean;
}) => setCarouselVisibilityAction({ carouselVisibility });

const setDismissedDynamicCardsAction =
  createAction<SettingsSetDismissedDynamicCardsPayload>(
    SettingsActionTypes.SETTINGS_SET_DISMISSED_DYNAMIC_CARDS,
  );
export const setDismissedDynamicCards = (dismissedDynamicCards: string[]) =>
  setDismissedDynamicCardsAction({ dismissedDynamicCards });

const setAvailableUpdateAction =
  createAction<SettingsSetAvailableUpdatePayload>(
    SettingsActionTypes.SETTINGS_SET_AVAILABLE_UPDATE,
  );
export const setAvailableUpdate = (hasAvailableUpdate: boolean) =>
  setAvailableUpdateAction({
    hasAvailableUpdate,
  });

const setThemeAction = createAction<SettingsSetThemePayload>(
  SettingsActionTypes.SETTINGS_SET_THEME,
);
export const setTheme = (theme: Theme) =>
  setThemeAction({
    theme,
  });

const setOsThemeAction = createAction<SettingsSetOsThemePayload>(
  SettingsActionTypes.SETTINGS_SET_OS_THEME,
);
export const setOsTheme = (osTheme: string) =>
  setOsThemeAction({
    osTheme,
  });

const setDiscreetModeAction = createAction<SettingsSetDiscreetModePayload>(
  SettingsActionTypes.SETTINGS_SET_DISCREET_MODE,
);
export const setDiscreetMode = (discreetMode: boolean) =>
  setDiscreetModeAction({
    discreetMode,
  });

const setLanguageAction = createAction<SettingsSetLanguagePayload>(
  SettingsActionTypes.SETTINGS_SET_LANGUAGE,
);
export const setLanguage = (language: string) =>
  setLanguageAction({
    language,
  });

const setLocaleAction = createAction<SettingsSetLocalePayload>(
  SettingsActionTypes.SETTINGS_SET_LOCALE,
);
export const setLocale = (locale: string) =>
  setLocaleAction({
    locale,
  });

const setSwapSelectableCurrenciesAction =
  createAction<SettingsSetSwapSelectableCurrenciesPayload>(
    SettingsActionTypes.SET_SWAP_SELECTABLE_CURRENCIES,
  );
export const setSwapSelectableCurrencies = (selectableCurrencies: string[]) =>
  setSwapSelectableCurrenciesAction({
    selectableCurrencies,
  });

const setSwapKYCStatusAction = createAction<SettingsSetSwapKycPayload>(
  SettingsActionTypes.SET_SWAP_KYC,
);
export const setSwapKYCStatus = (payload: {
  provider?: string;
  id?: string;
  status?: string | null;
}) => setSwapKYCStatusAction(payload);

const resetSwapLoginAndKYCDataAction = createAction(
  SettingsActionTypes.RESET_SWAP_LOGIN_AND_KYC_DATA,
);
export const resetSwapLoginAndKYCData = resetSwapLoginAndKYCDataAction;

const swapAcceptProviderAction =
  createAction<SettingsAcceptSwapProviderPayload>(
    SettingsActionTypes.ACCEPT_SWAP_PROVIDER,
  );
export const swapAcceptProvider = (acceptedProvider: string) =>
  swapAcceptProviderAction({
    acceptedProvider,
  });

const setLastSeenDeviceAction = createAction<SettingsLastSeenDevicePayload>(
  SettingsActionTypes.LAST_SEEN_DEVICE,
);
export const setLastSeenDevice = ({ deviceInfo }: { deviceInfo: DeviceInfo }) =>
  setLastSeenDeviceAction({ deviceInfo });

const setLastSeenDeviceInfoAction =
  createAction<SettingsLastSeenDeviceInfoPayload>(
    SettingsActionTypes.LAST_SEEN_DEVICE_INFO,
  );
export const setLastSeenDeviceInfo = (dmi: DeviceModelInfo) =>
  setLastSeenDeviceInfoAction({ dmi });

const addStarredMarketCoinsAction =
  createAction<SettingsAddStarredMarketcoinsPayload>(
    SettingsActionTypes.ADD_STARRED_MARKET_COINS,
  );
export const addStarredMarketCoins = (starredMarketCoin: string) =>
  addStarredMarketCoinsAction({
    starredMarketCoin,
  });

const removeStarredMarketCoinsAction =
  createAction<SettingsRemoveStarredMarketcoinsPayload>(
    SettingsActionTypes.REMOVE_STARRED_MARKET_COINS,
  );
export const removeStarredMarketCoins = (starredMarketCoin: string) =>
  removeStarredMarketCoinsAction({
    starredMarketCoin,
  });

const setLastConnectedDeviceAction =
  createAction<SettingsSetLastConnectedDevicePayload>(
    SettingsActionTypes.SET_LAST_CONNECTED_DEVICE,
  );
export const setLastConnectedDevice = (lastConnectedDevice: Device) =>
  setLastConnectedDeviceAction({
    lastConnectedDevice,
  });

const setCustomImageBackupAction =
  createAction<SettingsSetCustomImageBackupPayload>(
    SettingsActionTypes.SET_CUSTOM_IMAGE_BACKUP,
  );
export const setCustomImageBackup = ({
  hash,
  hex,
}: SettingsSetCustomImageBackupPayload) =>
  setCustomImageBackupAction({
    hash,
    hex,
  });

const setHasOrderedNanoAction = createAction<SettingsSetHasOrderedNanoPayload>(
  SettingsActionTypes.SET_HAS_ORDERED_NANO,
);
export const setHasOrderedNano = (hasOrderedNano: boolean) =>
  setHasOrderedNanoAction({
    hasOrderedNano,
  });

const setMarketRequestParamsAction =
  createAction<SettingsSetMarketRequestParamsPayload>(
    SettingsActionTypes.SET_MARKET_REQUEST_PARAMS,
  );
export const setMarketRequestParams = (
  marketRequestParams: MarketListRequestParams,
) =>
  setMarketRequestParamsAction({
    marketRequestParams,
  });

const setMarketCounterCurrencyAction =
  createAction<SettingsSetMarketCounterCurrencyPayload>(
    SettingsActionTypes.SET_MARKET_COUNTER_CURRENCY,
  );
export const setMarketCounterCurrency = (marketCounterCurrency: string) =>
  setMarketCounterCurrencyAction({
    marketCounterCurrency,
  });

const setMarketFilterByStarredAccountsAction =
  createAction<SettingsSetMarketFilterByStarredAccountsPayload>(
    SettingsActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS,
  );
export const setMarketFilterByStarredAccounts = (
  marketFilterByStarredAccounts: boolean,
) =>
  setMarketFilterByStarredAccountsAction({
    marketFilterByStarredAccounts,
  });

const setSensitiveAnalyticsAction =
  createAction<SettingsSetSensitiveAnalyticsPayload>(
    SettingsActionTypes.SET_SENSITIVE_ANALYTICS,
  );
export const setSensitiveAnalytics = (sensitiveAnalytics: boolean) =>
  setSensitiveAnalyticsAction({
    sensitiveAnalytics,
  });

const setFirstConnectionHasDeviceAction =
  createAction<SettingsSetFirstConnectionHasDevicePayload>(
    SettingsActionTypes.SET_FIRST_CONNECTION_HAS_DEVICE,
  );
export const setFirstConnectionHasDevice = (
  firstConnectionHasDevice: boolean,
) =>
  setFirstConnectionHasDeviceAction({
    firstConnectionHasDevice,
  });
const setNotificationsAction = createAction<SettingsSetNotificationsPayload>(
  SettingsActionTypes.SET_NOTIFICATIONS,
);
export const setNotifications = (
  notifications: Partial<SettingsState["notifications"]>,
) =>
  setNotificationsAction({
    notifications,
  });

const setWalletTabNavigatorLastVisitedTabAction =
  createAction<SettingsSetWalletTabNavigatorLastVisitedTabPayload>(
    SettingsActionTypes.WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB,
  );
export const setWalletTabNavigatorLastVisitedTab = (
  walletTabNavigatorLastVisitedTab: keyof WalletTabNavigatorStackParamList,
) =>
  setWalletTabNavigatorLastVisitedTabAction({
    walletTabNavigatorLastVisitedTab,
  });

const setOverriddenFeatureFlagAction =
  createAction<SettingsSetOverriddenFeatureFlagPlayload>(
    SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAG,
  );
export const setOverriddenFeatureFlag = (
  id: FeatureId,
  value: Feature | undefined,
) =>
  setOverriddenFeatureFlagAction({
    id,
    value,
  });

const setOverriddenFeatureFlagsAction =
  createAction<SettingsSetOverriddenFeatureFlagsPlayload>(
    SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAGS,
  );
export const setOverriddenFeatureFlags = (overriddenFeatureFlags: {
  [key in FeatureId]?: Feature;
}) => setOverriddenFeatureFlagsAction({ overriddenFeatureFlags });

const setFeatureFlagsBannerVisibleAction =
  createAction<SettingsSetFeatureFlagsBannerVisiblePayload>(
    SettingsActionTypes.SET_FEATURE_FLAGS_BANNER_VISIBLE,
  );
export const setFeatureFlagsBannerVisible = (
  featureFlagsBannerVisible: boolean,
) => setFeatureFlagsBannerVisibleAction({ featureFlagsBannerVisible });

const dangerouslyOverrideStateAction =
  createAction<SettingsDangerouslyOverrideStatePayload>(
    SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE,
  );
export const dangerouslyOverrideState = (s: State) =>
  dangerouslyOverrideStateAction(s);

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
  return [val, setter, options] as const;
}
