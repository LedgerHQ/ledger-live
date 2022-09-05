import type {
  // CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
// import type { StackScreenProps } from "@react-navigation/stack";
// import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { Device } from "@ledgerhq/types-devices";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { NavigatorName, ScreenName } from "../../const";
import { BleDevicePairingFlowParams } from "../../screens/BleDevicePairingFlow/index";

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
  [ScreenName.Account]: {
    currencyId: string;
    currencyType: "CryptoCurrency" | "TokenCurrency";
  } | {
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
  [ScreenName.ScanAccounts]: { data?: any[]; onFinish?: () => void; };
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

export type BaseNavigatorStackParamList = {
  BleDevicePairingFlow: BleDevicePairingFlowParams;

  [NavigatorName.Main]: {
    hideTabNavigation?: boolean;
  };
  [NavigatorName.BuyDevice]: undefined;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;
};

export type RootStackParamList = {
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: undefined;
};

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList { }
  }
}
