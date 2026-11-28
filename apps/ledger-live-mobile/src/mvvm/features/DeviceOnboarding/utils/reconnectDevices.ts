import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { buildUsbCompatDeviceId, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { isRebootedDevice } from "./rebootedDevice";

function toLiveDevice(known: KnownDevice): Device {
  const wired = known.transport === rnHidTransportIdentifier;
  return {
    deviceId: wired ? buildUsbCompatDeviceId(known.id) : known.id,
    deviceName: known.name ?? undefined,
    modelId: known.deviceModelId,
    wired,
  };
}

/** The updated device alone, or every known device when none matches (adoptConnection rejects any other). */
export function selectKnownDevicesToReconnect<T extends KnownDevice>(
  knownDevices: readonly T[],
  updatedDevice: Device | null,
): T[] {
  if (!updatedDevice) return [];
  const matching = knownDevices.filter(known =>
    isRebootedDevice(updatedDevice, toLiveDevice(known)),
  );
  return matching.length > 0 ? matching : [...knownDevices];
}
