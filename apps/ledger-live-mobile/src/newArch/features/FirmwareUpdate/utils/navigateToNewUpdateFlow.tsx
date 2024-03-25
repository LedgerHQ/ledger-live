import { DeviceModelInfo } from "@ledgerhq/types-live";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName, NavigatorName } from "~/const";
import { FirmwareUpdateContextEntity } from "@ledgerhq/live-common/device-core/managerApi/entities/FirmwareUpdateContextEntity";
import { UpdateStep } from "~/screens/FirmwareUpdate";
import { Device } from "@ledgerhq/hw-transport";

export function navigateToNewUpdateFlow({
  navigation,
  lastConnectedDevice,
  lastSeenDeviceModelInfo,
  latestFirmware,
  onBackFromUpdate,
}: {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  lastConnectedDevice: Device | null;
  lastSeenDeviceModelInfo: DeviceModelInfo | null | undefined;
  latestFirmware: FirmwareUpdateContextEntity | null;
  onBackFromUpdate: (updateState: UpdateStep) => void;
}) {
  navigation.navigate(NavigatorName.Manager, {
    screen: ScreenName.FirmwareUpdate,
    params: {
      device: lastConnectedDevice,
      deviceInfo: lastSeenDeviceModelInfo?.deviceInfo,
      firmwareUpdateContext: latestFirmware,
      onBackFromUpdate,
    },
  });
}
