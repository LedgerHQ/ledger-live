import { webHidTransportIdentifier, type DisplayedDevice } from "@ledgerhq/live-dmk-desktop";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";

export function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: webHidTransportIdentifier,
    ...overrides,
  };
}

export function makeDisplayedDevice(overrides: Partial<DisplayedDevice> = {}): DisplayedDevice {
  return {
    type: "available",
    knownDevice: makeKnownDevice(),
    onSelect: () => undefined,
    ...overrides,
  } as DisplayedDevice;
}
