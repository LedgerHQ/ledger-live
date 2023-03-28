import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorScreenParams } from "@react-navigation/native";

import { NavigatorName, ScreenName } from "../../../const";

export type OnboardingCarefulWarningParamList = {
  [ScreenName.OnboardingModalWarning]: { onNext?: () => void };
  [ScreenName.OnboardingModalSyncDesktopInformation]: { onNext?: () => void };
  [ScreenName.OnboardingModalRecoveryPhraseWarning]: {
    onNext?: () => void;
  };
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
  [NavigatorName.OnboardingCarefulWarning]: NavigatorScreenParams<OnboardingCarefulWarningParamList>;
  [NavigatorName.OnboardingPreQuiz]: NavigatorScreenParams<OnboardingPreQuizModalNavigatorParamList>;
  [ScreenName.OnboardingDoYouHaveALedgerDevice]: undefined;
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
    deviceModelId: DeviceModelId;
    next?: string;
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
};
