import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorScreenParams } from "@react-navigation/native";

import { NavigatorName, ScreenName } from "~/const";

export type OnboardingPreQuizModalNavigatorParamList = {
  [ScreenName.OnboardingPreQuizModal]: { onNext?: () => void };
};

export type OnboardingNavigatorParamList = {
  [ScreenName.OnboardingWelcome]: undefined;
  [ScreenName.OnboardingPostWelcomeSelection]: { userHasDevice: boolean };
  [ScreenName.OnboardingWelcomeBack]: undefined;
  [ScreenName.GetDevice]: undefined;
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
  };
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
  [ScreenName.OnboardingBleDevicePairingFlow]: undefined;
};
