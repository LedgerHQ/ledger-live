import type { NavigatorScreenParams } from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";

import { Device } from "@ledgerhq/types-devices";
import { Account, AccountLike, DeviceInfo } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { NavigatorName, ScreenName } from "../../const";
import { ManagerTab } from "../../const/manager";
import { AccountsNavigatorParamList } from "./types/AccountsNavigator";

export type AccountSettingsNavigatorParamList = {
  [ScreenName.AccountSettingsMain]: {
    accountId: string;
  };
  [ScreenName.EditAccountUnits]: {
    accountId: string;
  };
  [ScreenName.EditAccountName]: {
    account: AccountLike;
    accountId?: string;
    accountName?: string;
    onAccountNameChange: (name: string, changedAccount: Account) => void;
  };
  [ScreenName.AdvancedLogs]?: {
    accountId: string;
  };
  [ScreenName.AccountCurrencySettings]: {
    currencyId: string;
  };
  [ScreenName.Accounts]: { currency?: string; search?: string } | undefined;
};

export type AccountSettingsNavigatorProps<
  RouteName extends keyof AccountSettingsNavigatorParamList,
> = StackScreenProps<AccountSettingsNavigatorParamList, RouteName>;

export type AddAccountsNavigatorParamList = {
  [ScreenName.AddAccountsSelectCrypto]: {
    filterCurrencyIds?: string[];
  };
  [ScreenName.AddAccountsSelectDevice]: {
    currency?: CryptoCurrency | TokenCurrency;
    inline?: boolean;
    returnToSwap?: boolean;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.AddAccountsAccounts]: {
    currency: CryptoCurrency | TokenCurrency;
    device: Device;
    inline?: boolean;
    returnToSwap?: boolean;
    onSuccess?: (_?: any) => void;
  };
  [ScreenName.AddAccountsSuccess]?: {
    currency: CryptoCurrency;
    deviceId: string;
  };
  [ScreenName.EditAccountName]: {
    account: any;
    accountId?: string;
    accountName?: string;
    onAccountNameChange: (name: string, changedAccount: Account) => void;
  };
  [ScreenName.AddAccountsTokenCurrencyDisclaimer]: {
    token: TokenCurrency;
  };
};

export type ImportAccountsNavigatorParamList = {
  [ScreenName.ScanAccounts]: { data?: any[]; onFinish?: () => void };
  [ScreenName.DisplayResult]: {
    result: ImportAccountsResult;
    onFinish?: () => void;
  };
  [ScreenName.FallBackCameraScreen]: undefined;
};

export type OnboardingCarefulWarningParamList = {
  [ScreenName.OnboardingModalWarning]: undefined;
  [ScreenName.OnboardingModalSyncDesktopInformation]: { onNext?: () => void };
  [ScreenName.OnboardingModalRecoveryPhraseWarning]: { onNext?: () => void };
};

export type OnboardingPreQuizModalNavigatorParamList = {
  [ScreenName.OnboardingPreQuizModal]: { onNext?: () => void };
};

export type OnboardingNavigatorParamList = {
  [ScreenName.OnboardingWelcome]: undefined;
  [ScreenName.OnboardingPostWelcomeSelection]: { userHasDevice: boolean };
  [ScreenName.GetDevice]: undefined;
  [ScreenName.OnboardingLanguage]: undefined;
  [ScreenName.OnboardingTermsOfUse]: undefined;
  [ScreenName.OnboardingDeviceSelection]: undefined;
  [ScreenName.OnboardingUseCase]: { deviceModelId: DeviceModelId };
  [ScreenName.OnboardingModalWarning]: NavigatorScreenParams<OnboardingCarefulWarningParamList>;
  [ScreenName.OnboardingPreQuizModal]: NavigatorScreenParams<OnboardingPreQuizModalNavigatorParamList>;
  [ScreenName.OnboardingDoYouHaveALedgerDevice]: undefined;
  [ScreenName.OnboardingModalDiscoverLive]: undefined;
  [ScreenName.OnboardingModalSetupNewDevice]: undefined;
  [ScreenName.OnboardingSetupDeviceInformation]: undefined;
  [ScreenName.OnboardingModalSetupSecureRecovery]: undefined;
  [ScreenName.OnboardingGeneralInformation]: undefined;
  [ScreenName.OnboardingBluetoothInformation]: undefined;
  [ScreenName.OnboardingSetNewDevice]: { deviceModelId: DeviceModelId };
  [ScreenName.OnboardingRecoveryPhrase]: { deviceModelId: DeviceModelId };
  [ScreenName.OnboardingInfoModal]: {
    sceneInfoKey: string;
  };
  [ScreenName.OnboardingPairNew]: {
    deviceModelId: DeviceModelId;
    next?: string;
    showSeedWarning: boolean;
  };
  [ScreenName.OnboardingImportAccounts]: {
    deviceModelId: DeviceModelId;
  };
  [ScreenName.OnboardingFinish]: undefined;
  [NavigatorName.PasswordAddFlow]: undefined;
  [ScreenName.OnboardingQuiz]: {
    deviceModelId: string;
  };
  [ScreenName.OnboardingQuizFinal]: {
    success: boolean;
    deviceModelId: DeviceModelId;
  };
};

export type BaseOnboardingNavigatorParamList = {
  [NavigatorName.Onboarding]: NavigatorScreenParams<OnboardingNavigatorParamList>;
  [NavigatorName.ImportAccounts]: undefined;
  [NavigatorName.BuyDevice]: undefined;
  [ScreenName.PairDevices]?: {
    onDone?: (_: Device) => void;
  };
  [ScreenName.EditDeviceName]: {
    deviceId: string;
    deviceName: string;
  };
  [NavigatorName.PasswordAddFlow]: undefined;
  [NavigatorName.PasswordModifyFlow]: undefined;
};

export type PortfolioNavigatorStackParamList = {
  [ScreenName.Portfolio]: undefined;
  [NavigatorName.PortfolioAccounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
};

export type MarketNavigatorStackParamList = {
  [ScreenName.MarketList]: { top100?: boolean };
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };
};

export type DiscoverNavigatorStackParamList = {
  [ScreenName.DiscoverScreen]: undefined;
  [ScreenName.PlatformCatalog]: {
    defaultAccount?: AccountLike | null;
    defaultParentAccount?: Account | null;
    platform?: string | null;
  };
};

export type ManagerNavigatorStackParamList = {
  [ScreenName.Manager]: {
    searchQuery?: string;
    tab?: ManagerTab;
    installApp?: string;
    firmwareUpdate?: boolean;
    device?: Device;
    appsToRestore?: string[];
  };
  [ScreenName.ManagerMain]: {
    device: Device;
    deviceInfo: DeviceInfo;
    result: ListAppsResult;
    searchQuery?: string;
    firmwareUpdate?: boolean;
    appsToRestore?: string[];
    updateModalOpened?: boolean;
    tab: ManagerTab;
  };
};

export type MainNavigatorParamList = {
  [NavigatorName.Portfolio]: NavigatorScreenParams<PortfolioNavigatorStackParamList>;
  [NavigatorName.Market]: NavigatorScreenParams<MarketNavigatorStackParamList>;
  [ScreenName.Transfer]: undefined;
  [NavigatorName.Discover]: NavigatorScreenParams<DiscoverNavigatorStackParamList>;
  [NavigatorName.Manager]: NavigatorScreenParams<ManagerNavigatorStackParamList>;
};

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends BaseNavigatorStackParamList {}
  }
}
