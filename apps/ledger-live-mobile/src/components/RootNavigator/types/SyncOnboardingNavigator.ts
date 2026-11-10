import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo, FirmwareUpdateContext, SeedOriginType } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";

export type SyncOnboardingStackParamList = {
  [ScreenName.SyncOnboardingCompanion]: {
    device: Device;
    /** Set when opened above the screen the user came from, instead of the setup device list. */
    backReturnsToPrevious?: boolean;
  };
  [ScreenName.SyncOnboardingCompletion]: {
    device: Device;
    seedConfiguration?: SeedOriginType;
  };
  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
    isDeviceOnboarded?: boolean;
  };
};
