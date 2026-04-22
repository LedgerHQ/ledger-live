import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Linking } from "react-native";
import type { DeviceModelId } from "@ledgerhq/devices";
import { findMatchingNewDevice, useBleDevicesScanning } from "@ledgerhq/live-dmk-mobile";
import { useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { track } from "~/analytics";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

export interface DeviceSectionDevice {
  readonly id: string;
  readonly name: string;
  readonly modelId: DeviceModelId;
  readonly available: boolean;
}

interface DeviceSectionViewModel {
  readonly devices: readonly DeviceSectionDevice[];
  readonly hasDevices: boolean;
  readonly onAddDevice: () => void;
  readonly onExploreDevices: () => void;
  readonly onDevicePress: (device: DeviceSectionDevice) => void;
}

export const useDeviceSectionViewModel = (): DeviceSectionViewModel => {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const knownDevices = useSelector(bleDevicesSelector);
  const { scannedDevices } = useBleDevicesScanning(true);

  const devices = useMemo(
    () =>
      [...knownDevices].reverse().map(({ id, name, modelId }) => ({
        id,
        name,
        modelId,
        available:
          findMatchingNewDevice({ deviceId: id, deviceName: name, modelId }, scannedDevices) !==
          null,
      })),
    [knownDevices, scannedDevices],
  );

  const hasDevices = devices.length > 0;

  const onAddDevice = useCallback(() => {
    track("button_clicked", { button: "Add", page: ScreenName.MyWallet });
    navigation.navigate(ScreenName.BleDevicePairingFlow);
  }, [navigation]);

  const exploreDevicesUrl = useLocalizedUrl(urls.hardwareWallet);

  const onExploreDevices = useCallback(() => {
    track("button_clicked", { button: "ExploreDevices", page: ScreenName.MyWallet });
    Linking.openURL(exploreDevicesUrl);
  }, [exploreDevicesUrl]);

  const onDevicePress = useCallback(
    (device: DeviceSectionDevice) => {
      track("button_clicked", {
        button: "Device",
        page: ScreenName.MyWallet,
        deviceModelId: device.modelId,
      });
      navigation.navigate(NavigatorName.MyLedger, {
        screen: ScreenName.MyLedgerChooseDevice,
        params: {
          device: {
            deviceId: device.id,
            deviceName: device.name,
            modelId: device.modelId,
            wired: false,
          },
        },
      });
    },
    [navigation],
  );

  return { devices, onAddDevice, onExploreDevices, hasDevices, onDevicePress };
};
