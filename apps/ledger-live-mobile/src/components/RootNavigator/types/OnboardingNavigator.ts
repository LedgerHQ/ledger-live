import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";
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
  [ScreenName.OnboardingNotificationsOptIn]: undefined;
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
    isRestoreSeed?: boolean;
    connectSeededDevice?: boolean;
  };
  [ScreenName.DeviceOnboardingFunnel]: {
    pairedDeviceId?: string;
    wasReadOnlyAtEntry: boolean;
  };
  [ScreenName.DeviceOnboardingSyncOffer]: {
    device: Device;
    wasReadOnlyAtEntry: boolean;
    seededOnEntry: boolean;
  };
  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
    isDeviceOnboarded?: boolean;
  };
  [ScreenName.OnboardingSecureYourCrypto]: {
    deviceModelId?: DeviceModelId;
  };
  [ScreenName.OnboardingFundSuccess]: {
    receiveFlowSuccess: boolean;
    deviceModelId?: DeviceModelId;
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
  [ScreenName.OnboardingBleDevicePairingFlow]: {
    filterByDeviceModelId: DeviceModelId;
  };
  [NavigatorName.AnalyticsOptInPrompt]: NavigatorScreenParams<AnalyticsOptInPromptNavigatorParamList>;
  [NavigatorName.LandingPages]: NavigatorScreenParams<LandingPagesNavigatorParamList>;
};
