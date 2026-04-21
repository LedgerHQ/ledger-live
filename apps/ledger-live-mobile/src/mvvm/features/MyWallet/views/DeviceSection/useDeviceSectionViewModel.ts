import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DeviceModelId } from "@ledgerhq/devices";
import { useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";
import { ScreenName } from "~/const";

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
}

export const useDeviceSectionViewModel = (): DeviceSectionViewModel => {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const knownDevices = useSelector(bleDevicesSelector);

  const devices = useMemo(
    () =>
      [...knownDevices]
        .reverse()
        .map(({ id, name, modelId }) => ({ id, name, modelId, available: false })),
    [knownDevices],
  );

  const hasDevices = devices.length > 0;

  const onAddDevice = useCallback(() => {
    navigation.navigate(ScreenName.BleDevicePairingFlow);
  }, [navigation]);

  return { devices, hasDevices, onAddDevice };
};
