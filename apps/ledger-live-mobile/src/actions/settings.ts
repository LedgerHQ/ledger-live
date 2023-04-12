import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createAction } from "redux-actions";
import { useDispatch, useSelector } from "react-redux";
import type { PortfolioRange } from "@ledgerhq/types-live";
import { selectedTimeRangeSelector } from "../reducers/settings";
import {
  SettingsAcceptSwapProviderPayload,
  SettingsAddStarredMarketcoinsPayload,
  SettingsBlacklistTokenPayload,
  DangerouslyOverrideStatePayload,
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
  SettingsSetStatusCenterPayload,
  SettingsSetOverriddenFeatureFlagPlayload,
  SettingsSetOverriddenFeatureFlagsPlayload,
  SettingsSetFeatureFlagsBannerVisiblePayload,
  SettingsSetDebugAppLevelDrawerOpenedPayload,
  SettingsFilterTokenOperationsZeroAmountPayload,
  SettingsLastSeenDeviceLanguagePayload,
  SettingsCompleteOnboardingPayload,
  SettingsSetDateFormatPayload,
  SettingsSetHasBeenUpsoldProtectPayload,
  SettingsSetHasSeenStaxEnabledNftsPopupPayload,
  SettingsSetCustomImageTypePayload,
  SettingsSetGeneralTermsVersionAccepted,
} from "./types";
import { ImageType } from "../components/CustomImage/types";

export const setPrivacy = createAction<SettingsSetPrivacyPayload>(
  SettingsActionTypes.SETTINGS_SET_PRIVACY,
);
export const disablePrivacy = createAction(
  SettingsActionTypes.SETTINGS_DISABLE_PRIVACY,
);
export const setPrivacyBiometrics =
  createAction<SettingsSetPrivacyBiometricsPayload>(
    SettingsActionTypes.SETTINGS_SET_PRIVACY_BIOMETRICS,
  );
export const setCountervalue = createAction<SettingsSetCountervaluePayload>(
  SettingsActionTypes.SETTINGS_SET_COUNTERVALUE,
);
export const importSettings = createAction<SettingsImportPayload>(
  SettingsActionTypes.SETTINGS_IMPORT,
);
export const importDesktopSettings = createAction<SettingsImportDesktopPayload>(
  SettingsActionTypes.SETTINGS_IMPORT_DESKTOP,
);
export const setReportErrors = createAction<SettingsSetReportErrorsPayload>(
  SettingsActionTypes.SETTINGS_SET_REPORT_ERRORS,
);
export const setAnalytics = createAction<SettingsSetAnalyticsPayload>(
  SettingsActionTypes.SETTINGS_SET_ANALYTICS,
);
export const setReadOnlyMode = createAction<SettingsSetReadOnlyModePayload>(
  SettingsActionTypes.SETTINGS_SET_READONLY_MODE,
);
export const setOrderAccounts = createAction<SettingsSetOrderAccountsPayload>(
  SettingsActionTypes.SETTINGS_SET_ORDER_ACCOUNTS,
);
export const setSelectedTimeRange =
  createAction<SettingsSetSelectedTimeRangePayload>(
    SettingsActionTypes.SETTINGS_SET_SELECTED_TIME_RANGE,
  );
export const updateCurrencySettings =
  createAction<SettingsUpdateCurrencyPayload>(
    SettingsActionTypes.UPDATE_CURRENCY_SETTINGS,
  );
export const completeCustomImageFlow = createAction(
  SettingsActionTypes.SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW,
);
export const setLastSeenCustomImage =
  createAction<SettingsSetLastSeenCustomImagePayload>(
    SettingsActionTypes.SET_LAST_SEEN_CUSTOM_IMAGE,
  );
export const clearLastSeenCustomImage = () =>
  setLastSeenCustomImage({ imageSize: 0, imageHash: "" });

export const completeOnboarding =
  createAction<SettingsCompleteOnboardingPayload>(
    SettingsActionTypes.SETTINGS_COMPLETE_ONBOARDING,
  );
export const installAppFirstTime =
  createAction<SettingsInstallAppFirstTimePayload>(
    SettingsActionTypes.SETTINGS_INSTALL_APP_FIRST_TIME,
  );
export const switchCountervalueFirst = createAction(
  SettingsActionTypes.SETTINGS_SWITCH_COUNTERVALUE_FIRST,
);
export const setHideEmptyTokenAccounts =
  createAction<SettingsHideEmptyTokenAccountsPayload>(
    SettingsActionTypes.SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS,
  );
export const setFilterTokenOperationsZeroAmount =
  createAction<SettingsFilterTokenOperationsZeroAmountPayload>(
    SettingsActionTypes.SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT,
  );
export const blacklistToken = createAction<SettingsBlacklistTokenPayload>(
  SettingsActionTypes.BLACKLIST_TOKEN,
);
export const showToken = createAction<SettingsShowTokenPayload>(
  SettingsActionTypes.SHOW_TOKEN,
);
export const hideNftCollection = createAction<SettingsHideNftCollectionPayload>(
  SettingsActionTypes.HIDE_NFT_COLLECTION,
);
export const unhideNftCollection =
  createAction<SettingsUnhideNftCollectionPayload>(
    SettingsActionTypes.UNHIDE_NFT_COLLECTION,
  );
export const dismissBanner = createAction<SettingsDismissBannerPayload>(
  SettingsActionTypes.SETTINGS_DISMISS_BANNER,
);
export const setDismissedDynamicCards =
  createAction<SettingsSetDismissedDynamicCardsPayload>(
    SettingsActionTypes.SETTINGS_SET_DISMISSED_DYNAMIC_CARDS,
  );
export const setAvailableUpdate =
  createAction<SettingsSetAvailableUpdatePayload>(
    SettingsActionTypes.SETTINGS_SET_AVAILABLE_UPDATE,
  );
export const setTheme = createAction<SettingsSetThemePayload>(
  SettingsActionTypes.SETTINGS_SET_THEME,
);
export const setOsTheme = createAction<SettingsSetOsThemePayload>(
  SettingsActionTypes.SETTINGS_SET_OS_THEME,
);
export const setDiscreetMode = createAction<SettingsSetDiscreetModePayload>(
  SettingsActionTypes.SETTINGS_SET_DISCREET_MODE,
);
export const setLanguage = createAction<SettingsSetLanguagePayload>(
  SettingsActionTypes.SETTINGS_SET_LANGUAGE,
);
export const setLocale = createAction<SettingsSetLocalePayload>(
  SettingsActionTypes.SETTINGS_SET_LOCALE,
);
export const setSwapSelectableCurrencies =
  createAction<SettingsSetSwapSelectableCurrenciesPayload>(
    SettingsActionTypes.SET_SWAP_SELECTABLE_CURRENCIES,
  );
export const setSwapKYCStatus = createAction<SettingsSetSwapKycPayload>(
  SettingsActionTypes.SET_SWAP_KYC,
);
export const resetSwapLoginAndKYCData = createAction(
  SettingsActionTypes.RESET_SWAP_LOGIN_AND_KYC_DATA,
);
export const swapAcceptProvider =
  createAction<SettingsAcceptSwapProviderPayload>(
    SettingsActionTypes.ACCEPT_SWAP_PROVIDER,
  );
export const setLastSeenDevice = createAction<SettingsLastSeenDevicePayload>(
  SettingsActionTypes.LAST_SEEN_DEVICE,
);
export const setLastSeenDeviceInfo =
  createAction<SettingsLastSeenDeviceInfoPayload>(
    SettingsActionTypes.LAST_SEEN_DEVICE_INFO,
  );
export const setLastSeenDeviceLanguageId =
  createAction<SettingsLastSeenDeviceLanguagePayload>(
    SettingsActionTypes.LAST_SEEN_DEVICE_LANGUAGE_ID,
  );
const setHasSeenStaxEnabledNftsPopupAction =
  createAction<SettingsSetHasSeenStaxEnabledNftsPopupPayload>(
    SettingsActionTypes.SET_HAS_SEEN_STAX_ENABLED_NFTS_POPUP,
  );
export const setHasSeenStaxEnabledNftsPopup = (
  hasSeenStaxEnabledNftsPopup: boolean,
) => setHasSeenStaxEnabledNftsPopupAction({ hasSeenStaxEnabledNftsPopup });
export const addStarredMarketCoins =
  createAction<SettingsAddStarredMarketcoinsPayload>(
    SettingsActionTypes.ADD_STARRED_MARKET_COINS,
  );
export const removeStarredMarketCoins =
  createAction<SettingsRemoveStarredMarketcoinsPayload>(
    SettingsActionTypes.REMOVE_STARRED_MARKET_COINS,
  );
export const setLastConnectedDevice =
  createAction<SettingsSetLastConnectedDevicePayload>(
    SettingsActionTypes.SET_LAST_CONNECTED_DEVICE,
  );
export const setCustomImageBackup =
  createAction<SettingsSetCustomImageBackupPayload>(
    SettingsActionTypes.SET_CUSTOM_IMAGE_BACKUP,
  );
const setCustomImageTypeAction =
  createAction<SettingsSetCustomImageTypePayload>(
    SettingsActionTypes.SET_CUSTOM_IMAGE_TYPE,
  );
export const setCustomImageType = (imageType: ImageType) =>
  setCustomImageTypeAction({ customImageType: imageType });
export const setHasOrderedNano = createAction<SettingsSetHasOrderedNanoPayload>(
  SettingsActionTypes.SET_HAS_ORDERED_NANO,
);
export const setMarketRequestParams =
  createAction<SettingsSetMarketRequestParamsPayload>(
    SettingsActionTypes.SET_MARKET_REQUEST_PARAMS,
  );
export const setMarketCounterCurrency =
  createAction<SettingsSetMarketCounterCurrencyPayload>(
    SettingsActionTypes.SET_MARKET_COUNTER_CURRENCY,
  );
export const setMarketFilterByStarredAccounts =
  createAction<SettingsSetMarketFilterByStarredAccountsPayload>(
    SettingsActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS,
  );
export const setSensitiveAnalytics =
  createAction<SettingsSetSensitiveAnalyticsPayload>(
    SettingsActionTypes.SET_SENSITIVE_ANALYTICS,
  );
export const setFirstConnectionHasDevice =
  createAction<SettingsSetFirstConnectionHasDevicePayload>(
    SettingsActionTypes.SET_FIRST_CONNECTION_HAS_DEVICE,
  );
export const setNotifications = createAction<SettingsSetNotificationsPayload>(
  SettingsActionTypes.SET_NOTIFICATIONS,
);
export const setWalletTabNavigatorLastVisitedTab =
  createAction<SettingsSetWalletTabNavigatorLastVisitedTabPayload>(
    SettingsActionTypes.WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB,
  );
export const setDateFormat = createAction<SettingsSetDateFormatPayload>(
  SettingsActionTypes.SETTINGS_SET_DATE_FORMAT,
);
export const setStatusCenter = createAction<SettingsSetStatusCenterPayload>(
  SettingsActionTypes.SET_STATUS_CENTER,
);
export const setOverriddenFeatureFlag =
  createAction<SettingsSetOverriddenFeatureFlagPlayload>(
    SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAG,
  );
export const setOverriddenFeatureFlags =
  createAction<SettingsSetOverriddenFeatureFlagsPlayload>(
    SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAGS,
  );
export const setFeatureFlagsBannerVisible =
  createAction<SettingsSetFeatureFlagsBannerVisiblePayload>(
    SettingsActionTypes.SET_FEATURE_FLAGS_BANNER_VISIBLE,
  );
export const setDebugAppLevelDrawerOpened =
  createAction<SettingsSetDebugAppLevelDrawerOpenedPayload>(
    SettingsActionTypes.SET_DEBUG_APP_LEVEL_DRAWER_OPENED,
  );
export const dangerouslyOverrideState =
  createAction<DangerouslyOverrideStatePayload>(
    SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE,
  );

export const setHasBeenUpsoldProtect =
  createAction<SettingsSetHasBeenUpsoldProtectPayload>(
    SettingsActionTypes.SET_HAS_BEEN_UPSOLD_PROTECT,
  );

export const setGeneralTermsVersionAccepted =
  createAction<SettingsSetGeneralTermsVersionAccepted>(
    SettingsActionTypes.SET_GENERAL_TERMS_VERSION_ACCEPTED,
  );

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
