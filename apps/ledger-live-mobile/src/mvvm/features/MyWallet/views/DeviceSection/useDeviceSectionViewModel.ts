import { useMemo } from "react";
import type { DeviceModelId } from "@ledgerhq/devices";
import { useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";

export interface DeviceSectionDevice {
  readonly id: string;
  readonly name: string;
  readonly modelId: DeviceModelId;
  readonly available: boolean;
}

interface DeviceSectionViewModel {
  readonly devices: readonly DeviceSectionDevice[];
}

export const useDeviceSectionViewModel = (): DeviceSectionViewModel => {
  const knownDevices = useSelector(bleDevicesSelector);

  const devices = useMemo(
    () =>
      [...knownDevices]
        .reverse()
        .map(({ id, name, modelId }) => ({ id, name, modelId, available: false })),
    [knownDevices],
  );

  return { devices };
};
