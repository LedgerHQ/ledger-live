import { webHidTransportIdentifier, type DisplayedDevice } from "@ledgerhq/live-dmk-desktop";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared/react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import React, { type ReactNode } from "react";

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

export function DeviceIntentTrackingTestWrapper({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <DeviceIntentTrackingProvider value={{ sourceFlow: "swap" }}>
      {children}
    </DeviceIntentTrackingProvider>
  );
}
