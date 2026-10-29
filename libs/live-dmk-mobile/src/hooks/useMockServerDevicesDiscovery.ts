import { useEffect, useState } from "react";
import { from, of, timer } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import type {
  DeviceModelId as DmkDeviceModelId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { getConfiguredMockServerTransport } from "../mockServerTransportConfig";
import { listMockServerDevices, type MockServerDevice } from "../mockServer/mockServerApi";
import { buildMockServerCompatDeviceId } from "../mockServer/mockServerCompatDeviceId";

const POLL_INTERVAL_MS = 2000;
const NO_DEVICES: MockServerDiscoveredDevice[] = [];

export type MockServerDiscoveredDevice = {
  deviceId: string;
  deviceName: string;
  wired: boolean;
  modelId: DeviceModelId;
  discoveredDevice: DiscoveredDevice;
};

export const mapMockServerDevice = (device: MockServerDevice): MockServerDiscoveredDevice => {
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

/** Lists the devices of the configured mock server session, polled while enabled. */
export const useMockServerDevicesDiscovery = (enabled: boolean): MockServerDiscoveredDevice[] => {
  const [devices, setDevices] = useState<MockServerDiscoveredDevice[]>(NO_DEVICES);

  useEffect(() => {
    const config = getConfiguredMockServerTransport();
    if (!enabled || !config) return;

    const subscription = timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() =>
          from(listMockServerDevices(config)).pipe(catchError(() => of<MockServerDevice[]>([]))),
        ),
      )
      .subscribe(serverDevices => {
        const nextDevices = serverDevices
          .map(mapMockServerDevice)
          .filter(device => device.modelId !== undefined);
        setDevices(prev => (haveSameDevices(prev, nextDevices) ? prev : nextDevices));
      });

    return () => {
      subscription.unsubscribe();
      setDevices(NO_DEVICES);
    };
  }, [enabled]);

  return enabled ? devices : NO_DEVICES;
};
