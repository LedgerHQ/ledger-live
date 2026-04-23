import { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Linking } from "react-native";
import type { DeviceModelId } from "@ledgerhq/devices";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { BluetoothRequired } from "@ledgerhq/errors";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { findMatchingNewDevice, useBleDevicesScanning } from "@ledgerhq/live-dmk-mobile";
import { useDispatch, useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";
import { removeKnownDevice } from "~/actions/ble";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { track } from "~/analytics";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useManagerDeviceAction } from "~/hooks/deviceActions";

export interface DeviceSectionDevice {
  readonly id: string;
  readonly name: string;
  readonly modelId: DeviceModelId;
  readonly available: boolean;
}

export interface DeviceSectionViewModel {
  readonly devices: readonly DeviceSectionDevice[];
  readonly hasDevices: boolean;
  readonly onAddDevice: () => void;
  readonly onExploreDevices: () => void;
  readonly onDevicePress: (device: DeviceSectionDevice) => void;
  readonly deviceToRemove: DeviceSectionDevice | null;
  readonly isRemoveDrawerOpen: boolean;
  readonly onOpenRemoveMenu: (device: DeviceSectionDevice) => void;
  readonly onCloseRemoveMenu: () => void;
  readonly onRemoveDevice: () => void;
  readonly selectedDevice: Device | null;
  readonly managerAction: ReturnType<typeof useManagerDeviceAction>;
  readonly onDeviceActionResult: (result: Result) => void;
  readonly onDeviceActionClose: () => void;
  readonly onDeviceActionError: (error: Error) => void;
}

export const useDeviceSectionViewModel = (): DeviceSectionViewModel => {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const dispatch = useDispatch();
  const knownDevices = useSelector(bleDevicesSelector);
  const [deviceToRemove, setDeviceToRemove] = useState<DeviceSectionDevice | null>(null);
  const [isRemoveDrawerOpen, setIsRemoveDrawerOpen] = useState(false);
  const { scannedDevices } = useBleDevicesScanning(true);
  const managerAction = useManagerDeviceAction();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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

  const onDevicePress = useCallback((device: DeviceSectionDevice) => {
    track("button_clicked", {
      button: "Device",
      page: ScreenName.MyWallet,
      deviceModelId: device.modelId,
    });
    setSelectedDevice({
      deviceId: device.id,
      deviceName: device.name,
      modelId: device.modelId,
      wired: false,
    });
  }, []);

  const onDeviceActionResult = useCallback(
    (result: Result) => {
      setSelectedDevice(null);
      if (result && "result" in result) {
        navigation.navigate(NavigatorName.MyLedger, {
          screen: ScreenName.MyLedgerDevice,
          params: { ...result, tab: "CATALOG" },
        });
      }
    },
    [navigation],
  );

  const onOpenRemoveMenu = (device: DeviceSectionDevice) => {
    setDeviceToRemove(device);
    setIsRemoveDrawerOpen(true);
  };

  const onCloseRemoveMenu = () => {
    setIsRemoveDrawerOpen(false);
  };

  const onRemoveDevice = useCallback(async () => {
    if (!deviceToRemove) return;
    dispatch(removeKnownDevice(deviceToRemove.id));
    setIsRemoveDrawerOpen(false);
    try {
      await disconnect(deviceToRemove.id);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    } catch {
      /* empty */
    }
    setDeviceToRemove(null);
  }, [deviceToRemove, dispatch]);

  const onDeviceActionClose = useCallback(() => {
    setSelectedDevice(null);
  }, []);

  const onDeviceActionError = useCallback((error: Error) => {
    if (error instanceof BluetoothRequired) {
      setSelectedDevice(null);
    }
  }, []);

  return {
    devices,
    hasDevices,
    onAddDevice,
    onExploreDevices,
    onDevicePress,
    deviceToRemove,
    isRemoveDrawerOpen,
    onOpenRemoveMenu,
    onCloseRemoveMenu,
    onRemoveDevice,
    selectedDevice,
    managerAction,
    onDeviceActionResult,
    onDeviceActionClose,
    onDeviceActionError,
  };
};
