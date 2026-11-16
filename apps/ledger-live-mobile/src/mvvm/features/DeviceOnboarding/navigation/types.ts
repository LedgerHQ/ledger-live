import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";

export type DeviceOnboardingNavigatorParamList = {
  [ScreenName.DeviceOnboardingConnect]: undefined;
  [ScreenName.DeviceOnboardingFunnel]: {
    pairedDeviceId?: string;
    wasReadOnlyAtEntry: boolean;
  };
  [ScreenName.DeviceOnboardingSyncOffer]: {
    device: Device;
    wasReadOnlyAtEntry: boolean;
  };
  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
    isDeviceOnboarded?: boolean;
  };
  [NavigatorName.WalletSync]: NavigatorScreenParams<WalletSyncNavigatorStackParamList>;
};
