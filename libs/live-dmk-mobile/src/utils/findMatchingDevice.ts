import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { matchDeviceByName } from "./matchDevicesByNameOrId";

const isSameModel = (device: Device, candidate: Device): boolean =>
  device.deviceModelId === candidate.deviceModelId;

const hasStableId = (device: Device): boolean => device.id !== "";

function matchesById(device: Device, candidate: Device): boolean {
  switch (device.transport) {
    case mockserverIdentifier:
      return hasStableId(device) && candidate.id === device.id;
    case rnBleTransportIdentifier:
      return isSameModel(device, candidate) && candidate.id === device.id;
    default:
      return false;
  }
}

function matchesWithoutId(device: Device, candidate: Device): boolean {
  switch (device.transport) {
    case mockserverIdentifier:
      return (!hasStableId(device) || !hasStableId(candidate)) && isSameModel(device, candidate);
    case rnHidTransportIdentifier:
    case speculosIdentifier:
      return isSameModel(device, candidate);
    case rnBleTransportIdentifier:
      return (
        isSameModel(device, candidate) &&
        matchDeviceByName({
          oldDevice: { deviceName: candidate.name },
          newDevice: { deviceName: device.name },
        })
      );
    default:
      return false;
  }
}

/** A candidate with an old default BLE name matches a device with the new one, not the reverse. */
export function findMatchingDevice<T extends Device>(device: Device, candidates: T[]): T | null {
  const sameTransportCandidates = candidates.filter(
    candidate => candidate.transport === device.transport,
  );

  return (
    sameTransportCandidates.find(candidate => matchesById(device, candidate)) ??
    sameTransportCandidates.find(candidate => matchesWithoutId(device, candidate)) ??
    null
  );
}
