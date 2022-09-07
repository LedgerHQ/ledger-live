import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { Device } from "@ledgerhq/types-devices";
import {
  Account,
  AccountLike,
  DeviceInfo,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { ListAppsResult } from "@ledgerhq/live-common/lib/apps";
import { NavigatorName, ScreenName } from "../../const";
import { BleDevicePairingFlowParams } from "../../screens/BleDevicePairingFlow/index";
import { ManagerTab } from "../../const/manager";

export type AccountSettingsNavigatorParamList = {
  [ScreenName.AccountSettingsMain]: {
    accountId: string;
  };
  [ScreenName.EditAccountUnits]: {
    accountId: string;
  };
  [ScreenName.EditAccountName]: {
    account: any;
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
  [ScreenName.Accounts]: { currency?: string; search?: string };
};

export type AccountsNavigatorParamList = {
  [ScreenName.Accounts]: { currency?: string; search?: string };
  [ScreenName.Account]:
  | {
    currencyId: string;
    currencyType: "CryptoCurrency" | "TokenCurrency";
  }
  | {
    accountId: string;
    parentId?: string;
  };
  [ScreenName.NftCollection]: {
    accountId: string;
    collection: ProtoNFT[];
  };
  [ScreenName.NftGallery]?: {
    accountId: string;
  };
  [ScreenName.NftViewer]: {
    nft: ProtoNFT;
  };
};

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

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]: CompositeScreenProps<
    StackScreenProps<{ [NavigatorName.Main]: { hideTabNavigation?: boolean } }>,
    BottomTabScreenProps<MainNavigatorParamList>
  >;
  [NavigatorName.BuyDevice]: undefined;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;

  [ScreenName.PostBuyDeviceScreen]: undefined;
  [ScreenName.PlatformApp]: undefined;
  [ScreenName.Learn]: undefined;
  [ScreenName.SwapV2FormSelectAccount]: undefined;
  [ScreenName.SwapOperationDetails]: undefined;
  [ScreenName.SwapV2FormSelectCurrency]: undefined;
  [ScreenName.SwapFormSelectProviderRate]: undefined;
  [ScreenName.SwapV2FormSelectFees]: undefined;
  [ScreenName.VerifyAccount]: undefined;
  [ScreenName.OperationDetails]: undefined;
  [ScreenName.PairDevices]: undefined;
  [ScreenName.EditDeviceName]: undefined;
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.PortfolioOperationHistory]: undefined;
  [ScreenName.Account]: undefined;
  [ScreenName.ScanRecipient]: undefined;
  [ScreenName.WalletConnectScan]: undefined;
  [ScreenName.WalletConnectDeeplinkingSelectAccount]: undefined;
  [ScreenName.WalletConnectConnect]: undefined;
  [ScreenName.FallbackCameraSend]: undefined;
  [ScreenName.BleDevicePairingFlow]: BleDevicePairingFlowParams;

  [NavigatorName.Settings]: NavigatorScreenParams<undefined>;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<undefined>;
  [NavigatorName.SendFunds]: NavigatorScreenParams<undefined>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<undefined>;
  [NavigatorName.SignTransaction]: NavigatorScreenParams<undefined>;
  [NavigatorName.Swap]: NavigatorScreenParams<undefined>;
  [NavigatorName.Lending]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingInfo]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingEnableFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingSupplyFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingWithdrawFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.Freeze]: NavigatorScreenParams<undefined>;
  [NavigatorName.Unfreeze]: NavigatorScreenParams<undefined>;
  [NavigatorName.ClaimRewards]: NavigatorScreenParams<undefined>;
  [NavigatorName.AddAccounts]: NavigatorScreenParams<undefined>;
  [NavigatorName.RequestAccount]: NavigatorScreenParams<undefined>;
  [NavigatorName.FirmwareUpdate]: NavigatorScreenParams<undefined>;
  [NavigatorName.Exchange]: NavigatorScreenParams<undefined>;
  [NavigatorName.ProviderList]: NavigatorScreenParams<undefined>;
  [NavigatorName.ProviderView]: NavigatorScreenParams<undefined>;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<undefined>;
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<undefined>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<undefined>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<undefined>;
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.MigrateAccountsFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.Analytics]: NavigatorScreenParams<undefined>;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<undefined>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<undefined>;
  [NavigatorName.Accounts]: NavigatorScreenParams<undefined>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type RootStackParamList = {
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList { }
  }
}
