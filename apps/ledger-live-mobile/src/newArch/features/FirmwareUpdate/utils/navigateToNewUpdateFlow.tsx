import { DeviceModelInfo } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { FirmwareUpdateContextEntity } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { Device } from "@ledgerhq/hw-transport";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";

export function navigateToNewUpdateFlow({
  navigation,
  lastConnectedDevice,
  lastSeenDeviceModelInfo,
  latestFirmware,
  onBackFromUpdate,
}: {
  navigation: BaseNavigation;
  lastConnectedDevice: Device | null;
  lastSeenDeviceModelInfo: DeviceModelInfo | null | undefined;
  latestFirmware: FirmwareUpdateContextEntity | null;
  onBackFromUpdate: (updateState: UpdateStep) => void;
}) {
  navigation.navigate(ScreenName.FirmwareUpdate, {
    device: lastConnectedDevice,
    deviceInfo: lastSeenDeviceModelInfo?.deviceInfo,
    firmwareUpdateContext: latestFirmware,
    onBackFromUpdate,
  });
}
