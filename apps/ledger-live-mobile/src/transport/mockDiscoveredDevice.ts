import {
  DiscoveredDevice,
  DeviceModelId as DMKDeviceModelId,
} from "@ledgerhq/device-management-kit";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";

export function makeMockDiscoveredDevice(device: Device): DiscoveredDevice {
  const dmkDeviceModelId = ledgerToDmkDeviceIdMap[device.modelId] ?? DMKDeviceModelId.NANO_X;
  return {
    id: device.deviceId,
    name: device.deviceName ?? "",
    deviceModel: {
      id: dmkDeviceModelId,
      name: getDeviceModel(device.modelId).productName,
      model: dmkDeviceModelId,
    },
    transport: "BLE",
  };
}
