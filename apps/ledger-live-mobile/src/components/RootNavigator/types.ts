import type { NavigatorScreenParams } from "@react-navigation/native";

import { Device } from "@ledgerhq/types-devices";
import { DeviceModelId } from "@ledgerhq/devices";
import { Result as ImportAccountsResult } from "@ledgerhq/live-common/cross";
import { NavigatorName, ScreenName } from "../../const";
import { MainNavigatorParamList } from "./types/MainNavigator";

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

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends MainNavigatorParamList {}
  }
}
