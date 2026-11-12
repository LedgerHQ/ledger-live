import { useMemo } from "react";
import type {
  DeviceModelId as DmkDeviceModelId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import {
  useMockServerDevices,
  type MockServerConfig,
  type MockServerDevice,
} from "@features/platform-device-mock-server";
import { buildMockServerCompatDeviceId, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";

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

// TODO: subscribe to dmk.listenToAvailableDevices({ transport: mockserverIdentifier }) instead of
// polling the mock server again, once the DMK mock server transport reports each device's
// connectivity type: its discovered devices lack it, and `wired` needs it.
export const useMockServerDevicesDiscovery = (
  config: MockServerConfig | null,
): MockServerDiscoveredDevice[] => {
  const serverDevices = useMockServerDevices(config);

  return useMemo(
    () =>
      serverDevices
        .map(mapMockServerDeviceToDiscoveredDevice)
        .filter(device => device.modelId !== undefined),
    [serverDevices],
  );
};
