import {
  DeviceModelId as DmkDeviceModelId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ledgerToDmkDeviceIdMap } from "../../../../libs/live-dmk-shared/lib-es/config/dmkToLedgerDeviceIdMap";
import { getDeviceModel } from "@ledgerhq/devices";

export function makeMockDiscoveredDevice(device: Device): DiscoveredDevice {
  return {
    id: device.deviceId,
    name: device.deviceName ?? "",
    deviceModel: {
      id: ledgerToDmkDeviceIdMap[device.modelId],
      name: getDeviceModel(device.modelId).productName,
      model: DmkDeviceModelId.NANO_X,
    },
    transport: "BLE",
  };
}
