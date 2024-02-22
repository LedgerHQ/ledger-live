import { ParamListBase, RouteProp } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { StackNavigationProp } from "@react-navigation/stack";
import { ScreenName, NavigatorName } from "~/const";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { isNewFirmwareUpdateUxSupported } from "./isFirmwareUpdateSupported";
import { FirmwareUpdateContextEntity } from "@ledgerhq/live-common/device-core/managerApi/entities/FirmwareUpdateContextEntity";
import { UpdateStep } from "~/screens/FirmwareUpdate";

export function navigateToFirmwareUpdateFlow({
  lastConnectedDevice,
  lastSeenDeviceModelInfo: lastSeenDeviceModelInfo,
  latestFirmware,
  route,
  navigation,
  onBackFromUpdate,
}: {
  lastConnectedDevice: ReturnType<typeof lastConnectedDeviceSelector>;
  lastSeenDeviceModelInfo: DeviceModelInfo | null | undefined;
  latestFirmware: FirmwareUpdateContextEntity | null;
  route: RouteProp<ParamListBase>;
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  onBackFromUpdate: (updateState: UpdateStep) => void;
}) {
  /**
   * "New" firmware update UX
   **/
  if (isNewFirmwareUpdateUxSupported(lastConnectedDevice?.modelId)) {
    navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.FirmwareUpdate,
      params: {
        device: lastConnectedDevice,
        deviceInfo: lastSeenDeviceModelInfo?.deviceInfo,
        firmwareUpdateContext: latestFirmware,
        onBackFromUpdate,
      },
    });
    return;
  }

  /**
   * "Old" firmware update UX
   */
  if (route.name === ScreenName.ManagerMain) {
    // if we're already in the manager page, only update the params
    navigation.setParams({ firmwareUpdate: true });
  } else {
    navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
      params: { firmwareUpdate: true },
    });
  }
}
