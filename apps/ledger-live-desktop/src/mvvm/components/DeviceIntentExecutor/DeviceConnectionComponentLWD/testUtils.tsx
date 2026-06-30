import React from "react";
import { webHidTransportIdentifier, type DisplayedDevice } from "@ledgerhq/live-dmk-desktop";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const mockTranslations: Record<string, string> = {
  "deviceIntentExecutor.connectDevice.common.ledgerDevice": "Ledger device",
  "deviceIntentExecutor.connectDevice.common.available": "Available",
  "deviceIntentExecutor.connectDevice.common.notConnected": "Not connected",
  "deviceIntentExecutor.connectDevice.states.loading.title": "Loading",
  "deviceIntentExecutor.connectDevice.states.connecting.title": "Loading",
  "deviceIntentExecutor.connectDevice.states.noKnownDevice.title": "Ledger device required",
  "deviceIntentExecutor.connectDevice.states.noKnownDevice.description":
    "To continue, set up or connect your signer.",
  "deviceIntentExecutor.connectDevice.states.noKnownDevice.connectLedgerDevice":
    "Connect Ledger device",
  "deviceIntentExecutor.connectDevice.states.noKnownDevice.noLedgerDevice":
    "I don't have a Ledger device",
  "deviceIntentExecutor.connectDevice.states.discovering.title": "Select a device",
  "deviceIntentExecutor.connectDevice.states.discovering.noAvailableDeviceTitle":
    "Power on and unlock a device",
  "deviceIntentExecutor.connectDevice.states.waitingForSelectedDevice.title":
    "Power on and unlock your {{productName}}",
  "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.title":
    "Something went wrong",
  "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.description":
    "Please try again or contact Ledger support.",
  "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.cta.retry": "Try again",
  "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.title":
    "Pairing unsuccessful",
  "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.description":
    "Please try again.",
  "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.tip":
    "Make sure your device is unlocked.",
  "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.cta.retry": "Try again",
  "deviceIntentExecutor.errors.intentError.title": "Unknown error",
  "deviceIntentExecutor.errors.intentError.description":
    "An error occurred. Please try again or contact Ledger support if the issue persists.",
};

export function mockT(key: string, params?: Record<string, string>): string {
  const translation = mockTranslations[key] ?? key;

  return Object.entries(params ?? {}).reduce(
    (value, [paramKey, paramValue]) => value.replace(`{{${paramKey}}}`, paramValue),
    translation,
  );
}

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

export function renderWithUser(ui: React.ReactElement) {
  return {
    user: userEvent.setup({ pointerEventsCheck: 0 }),
    ...render(ui),
  };
}
