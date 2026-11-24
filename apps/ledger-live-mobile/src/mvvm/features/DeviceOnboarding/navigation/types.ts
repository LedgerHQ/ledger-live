import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { FunnelProps, SeededResult } from "@features/platform-device-onboarding-analytics";

export type DeviceOnboardingNavigatorParamList = {
  [ScreenName.DeviceOnboardingConnect]: undefined;
  [ScreenName.DeviceOnboardingFunnel]: {
    pairedDeviceId?: string;
    wasReadOnlyAtEntry: boolean;
  };
  [ScreenName.DeviceOnboardingSyncOffer]: {
    device: Device;
    wasReadOnlyAtEntry: boolean;
    unseeded?: boolean;
    seededResult: SeededResult | null;
    /** The funnel props of an unseeded device, so the offer sends its events. */
    unseededProps?: FunnelProps | null;
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
