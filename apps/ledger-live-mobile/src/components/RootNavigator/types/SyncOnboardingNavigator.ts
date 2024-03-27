import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";

export type SyncOnboardingStackParamList = {
  [ScreenName.SyncOnboardingCompanion]: {
    device: Device;
  };
  [ScreenName.SyncOnboardingCompletion]: {
    device: Device;
  };
  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
  };
};
