import { NEVER } from "rxjs";
import type { DeviceConnectionResult, DeviceExtractedContext, Intent } from "../core";

export type MockDeviceInitializationInput = {
  appName: string;
};

export const defaultDeviceInitializationInput: MockDeviceInitializationInput = {
  appName: "Ethereum",
};

export function makeDeviceInitializationInput(
  overrides: Partial<MockDeviceInitializationInput> = {},
): MockDeviceInitializationInput {
  return {
    appName: "Ethereum",
    ...overrides,
  };
}

export const makeExtractedContext = (): DeviceExtractedContext => ({
  currentOsVersion: "2.0.0",
  osUpdateAvailable: false,
  currentAppName: "Ethereum",
  currentAppVersion: "1.10.0",
});

export const makeIntent = (
  overrides: Partial<Intent<unknown, unknown, unknown>> = {},
): Intent<unknown, unknown, unknown> => ({
  uuid: "intent-1",
  label: "test-intent",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: () => NEVER,
  component: () => null,
  input: undefined,
  ...overrides,
});

export const makeConnectionResult = (sessionId = "session-1"): DeviceConnectionResult => ({
  dmk: {} as DeviceConnectionResult["dmk"],
  sessionId,
  connectedDevice: {} as DeviceConnectionResult["connectedDevice"],
  compatDeviceId: "compat-1",
  compatDeviceModelId: "nanoX" as DeviceConnectionResult["compatDeviceModelId"],
  compatDeviceName: "Test device",
  compatDeviceWired: true,
});

export function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
