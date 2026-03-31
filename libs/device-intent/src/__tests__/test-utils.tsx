import { NEVER } from "rxjs";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
  RequiredDeviceContext,
} from "../core";
import { DeviceId } from "@ledgerhq/client-ids/ids";

export const defaultRequiredContext: RequiredDeviceContext = {
  appName: "Ethereum",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
};

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
  compatDeviceId: new DeviceId("compat-1"),
});

export function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
