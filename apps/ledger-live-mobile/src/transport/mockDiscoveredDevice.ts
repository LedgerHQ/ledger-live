import {
  DiscoveredDevice,
  DeviceModelId as DMKDeviceModelId,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";

function getTransportIdentifier(device: Device): TransportIdentifier {
  const [transportPrefix] = device.deviceId.split("|");

  if (transportPrefix === "usb") {
    return rnHidTransportIdentifier;
  }

  if (transportPrefix === "httpdebug" || transportPrefix === "speculos") {
    return transportPrefix;
  }

  return device.wired ? rnHidTransportIdentifier : rnBleTransportIdentifier;
}

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
    transport: getTransportIdentifier(device),
  };
}
