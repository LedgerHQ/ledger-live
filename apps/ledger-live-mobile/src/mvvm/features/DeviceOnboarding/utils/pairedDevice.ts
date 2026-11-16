import { USB_COMPAT_DEVICE_ID_PREFIX, isUsbCompatDeviceId } from "@ledgerhq/live-dmk-mobile";

export function matchesPairedDevice(knownId: string, pairedDeviceId: string | undefined): boolean {
  if (!pairedDeviceId) return false;
  if (knownId === pairedDeviceId) return true;
  const discoveryId = isUsbCompatDeviceId(pairedDeviceId)
    ? pairedDeviceId.slice(USB_COMPAT_DEVICE_ID_PREFIX.length)
    : pairedDeviceId;
  return knownId === discoveryId;
}

export function selectPairedKnownDevices<T extends { id: string }>(
  knownDevices: readonly T[],
  pairedDeviceId: string | undefined,
): T[] {
  const paired = knownDevices.filter(known => matchesPairedDevice(known.id, pairedDeviceId));
  return paired.length > 0 ? paired : [...knownDevices];
}
