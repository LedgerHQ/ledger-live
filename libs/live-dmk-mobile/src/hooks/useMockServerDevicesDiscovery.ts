import { useEffect, useState } from "react";
import { from, of, timer } from "rxjs";
import { catchError, exhaustMap } from "rxjs/operators";
import type {
  DeviceModelId as DmkDeviceModelId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import {
  buildMockServerCompatDeviceId,
  dmkToLedgerDeviceIdMap,
  listMockServerDevices,
  type MockServerConfig,
  type MockServerDevice,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";

const POLL_INTERVAL_MS = 2000;
const NO_DEVICES: MockServerDiscoveredDevice[] = [];

export type MockServerDiscoveredDevice = {
  deviceId: string;
  deviceName: string;
  wired: boolean;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};

export const mapMockServerDeviceToDiscoveredDevice = (
  device: MockServerDevice,
): MockServerDiscoveredDevice => {
  const dmkModelId = device.device_type as DmkDeviceModelId;
  return {
    deviceId: buildMockServerCompatDeviceId(device.id),
    deviceName: device.name,
    wired: device.connectivity_type === "USB",
    modelId: dmkToLedgerDeviceIdMap[dmkModelId],
    discoveredDevice: {
      id: device.id,
      name: device.name,
      deviceModel: { id: dmkModelId, model: dmkModelId, name: device.name },
      transport: mockserverIdentifier,
    },
  };
};

const haveSameDevices = (a: MockServerDiscoveredDevice[], b: MockServerDiscoveredDevice[]) =>
  a.length === b.length &&
  a.every(
    (device, i) =>
      device.deviceId === b[i].deviceId &&
      device.deviceName === b[i].deviceName &&
      device.wired === b[i].wired &&
      device.modelId === b[i].modelId,
  );

export const useMockServerDevicesDiscovery = (
  config: MockServerConfig | null,
): MockServerDiscoveredDevice[] => {
  const [devices, setDevices] = useState<MockServerDiscoveredDevice[]>(NO_DEVICES);
  const url = config?.url;
  const token = config?.token;

  useEffect(() => {
    if (!url || !token) return;

    const subscription = timer(0, POLL_INTERVAL_MS)
      .pipe(
        exhaustMap(() =>
          from(listMockServerDevices({ url, token })).pipe(
            catchError(() => of<MockServerDevice[]>([])),
          ),
        ),
      )
      .subscribe(serverDevices => {
        const nextDevices = serverDevices
          .map(mapMockServerDeviceToDiscoveredDevice)
          .filter(device => device.modelId !== undefined);
        setDevices(prev => (haveSameDevices(prev, nextDevices) ? prev : nextDevices));
      });

    return () => {
      subscription.unsubscribe();
      setDevices(NO_DEVICES);
    };
  }, [url, token]);

  return url && token ? devices : NO_DEVICES;
};
