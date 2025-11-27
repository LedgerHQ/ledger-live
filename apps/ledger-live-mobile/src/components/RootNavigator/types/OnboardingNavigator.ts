import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorScreenParams } from "@react-navigation/native";

import { NavigatorName, ScreenName } from "~/const";
import { AnalyticsOptInPromptNavigatorParamList } from "./AnalyticsOptInPromptNavigator";
import { LandingPagesNavigatorParamList } from "./LandingPagesNavigator";
import { DeviceSelectionNavigatorParamsList } from "LLM/features/DeviceSelection/types";
import { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import { CommonAddAccountNavigatorParamsList } from "./BaseNavigator";

export type OnboardingPreQuizModalNavigatorParamList = {
  [ScreenName.OnboardingPreQuizModal]: { onNext?: () => void };
};

export type OnboardingNavigatorParamList = {
  [ScreenName.OnboardingWelcome]: undefined;
  [ScreenName.OnboardingPostWelcomeSelection]: { userHasDevice: boolean };
  [ScreenName.OnboardingWelcomeBack]: undefined;
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<AddAccountsNavigatorParamList>> &
    CommonAddAccountNavigatorParamsList;
  [ScreenName.OnboardingLanguage]: undefined;
  [ScreenName.OnboardingTermsOfUse]: undefined;
  [ScreenName.OnboardingDeviceSelection]: undefined;
  [ScreenName.OnboardingUseCase]: { deviceModelId: DeviceModelId };
  [NavigatorName.OnboardingPreQuiz]: NavigatorScreenParams<OnboardingPreQuizModalNavigatorParamList>;
  [ScreenName.OnboardingModalDiscoverLive]: undefined;
  [ScreenName.OnboardingModalSetupNewDevice]: { deviceModelId: DeviceModelId };
  [ScreenName.OnboardingSetupDeviceInformation]: undefined;
  [ScreenName.OnboardingModalSetupSecureRecovery]: undefined;
  [ScreenName.OnboardingGeneralInformation]: undefined;
  [ScreenName.OnboardingBluetoothInformation]: undefined;
  [ScreenName.OnboardingProtectionConnectionInformation]: undefined;
  [ScreenName.OnboardingSetNewDevice]: { deviceModelId: DeviceModelId };
  [ScreenName.OnboardingRecoveryPhrase]: {
    deviceModelId: DeviceModelId;
    showSeedWarning?: boolean;
  };
  [ScreenName.OnboardingInfoModal]: {
    sceneInfoKey: string;
  };
  [ScreenName.OnboardingPairNew]: {
    deviceModelId?: DeviceModelId;
    next?: ScreenName.OnboardingProtectFlow;
    showSeedWarning?: boolean;
    isProtectFlow?: boolean;
    fromAccessExistingWallet?: boolean;
  };
  [ScreenName.OnboardingSecureYourCrypto]: undefined;
  [ScreenName.OnboardingFundSuccess]: { receiveFlowSuccess: boolean };
  [ScreenName.OnboardingProtectFlow]: {
    deviceModelId: DeviceModelId;
  };
  [ScreenName.OnboardingImportAccounts]:
    | {
        deviceModelId?: DeviceModelId;
      }
    | undefined;
  [NavigatorName.PasswordAddFlow]: undefined;
  [ScreenName.OnboardingQuiz]: {
    deviceModelId: DeviceModelId;
  };
  [ScreenName.OnboardingQuizFinal]: {
    success: boolean;
    deviceModelId: DeviceModelId;
  };
  [ScreenName.OnboardingBleDevicePairingFlow]: {
    filterByDeviceModelId: DeviceModelId;
  };
  [NavigatorName.AnalyticsOptInPrompt]: NavigatorScreenParams<AnalyticsOptInPromptNavigatorParamList>;
  [NavigatorName.LandingPages]: NavigatorScreenParams<LandingPagesNavigatorParamList>;
};
