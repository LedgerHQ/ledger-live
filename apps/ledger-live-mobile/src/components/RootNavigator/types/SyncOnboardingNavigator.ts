import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "../../../const";

export type SyncOnboardingStackParamList = {
  [ScreenName.SyncOnboardingBleDevicePairingFlow]: {
    filterByDeviceModelId?: DeviceModelId;
    areKnownDevicesDisplayed?: boolean;
    onSuccessAddToKnownDevices?: boolean;
  };
  [ScreenName.SyncOnboardingCompanion]: {
    device: Device;
  };
  [ScreenName.SyncOnboardingCompletion]: {
    device: Device;
  };
};
