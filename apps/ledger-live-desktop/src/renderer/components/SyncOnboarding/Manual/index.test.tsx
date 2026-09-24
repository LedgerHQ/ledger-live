import React from "react";
import { act, render } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { SeedPhraseType } from "@ledgerhq/types-live";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useToggleOnboardingEarlyCheck } from "@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks";
import { addDevice } from "~/renderer/actions/devices";
import SyncOnboardingScreen from ".";
import EarlySecurityChecks from "./EarlySecurityChecks";

jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling", () => ({
  useOnboardingStatePolling: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks", () => ({
  useToggleOnboardingEarlyCheck: jest.fn(),
}));

jest.mock("./EarlySecurityChecks", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("LLD/features/Onboarding/screens/SyncOnboardingCompanion", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("./EarlySecurityChecks/useChangeLanguagePrompt", () => ({
  useChangeLanguagePrompt: jest.fn(),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useConnectManagerAction: () => ({ useHook: jest.fn() }),
}));

const mockedUseOnboardingStatePolling = jest.mocked(useOnboardingStatePolling);
const mockedUseToggleOnboardingEarlyCheck = jest.mocked(useToggleOnboardingEarlyCheck);
const mockedEarlySecurityChecks = jest.mocked(EarlySecurityChecks);

const deviceA: Device = {
  deviceId: "device-a",
  deviceName: "Device A",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

const deviceB: Device = {
  deviceId: "device-b",
  deviceName: "Device B",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

function renderScreen(currentDevice: Device) {
  const resetStates = jest.fn();
  mockedUseOnboardingStatePolling.mockReturnValue({
    onboardingState: {
      currentOnboardingStep: OnboardingStep.OnboardingEarlyCheck,
      isOnboarded: false,
      isInRecoveryMode: false,
      seedPhraseType: SeedPhraseType.TwentyFour,
      currentSeedWordIndex: 0,
      charonSupported: false,
      charonStatus: null,
    },
    allowedError: null,
    fatalError: null,
    lockedDevice: false,
    resetStates,
  });
  mockedUseToggleOnboardingEarlyCheck.mockReturnValue({
    state: { toggleStatus: "none", lockedDevice: false, error: null },
  });

  const rendered = render(<SyncOnboardingScreen deviceModelId="nanoX" />, {
    initialState: {
      devices: { currentDevice, devices: [currentDevice] },
    },
  });

  return { ...rendered, resetStates };
}

function lastRenderedDeviceProp() {
  const calls = mockedEarlySecurityChecks.mock.calls;
  return calls.length ? calls[calls.length - 1][0].device : undefined;
}

describe("SyncOnboardingScreen (Manual)", () => {
  it("forces a re-validation when the connected device changes mid-flow (DONJON-1409)", () => {
    const { store, resetStates } = renderScreen(deviceA);

    expect(lastRenderedDeviceProp()?.deviceId).toBe("device-a");

    act(() => {
      store.dispatch(addDevice(deviceB));
    });

    expect(resetStates).toHaveBeenCalled();
    // `currentStep` is forced back to "loading" as soon as the change is detected,
    // so the new device is never handed to the (now-stale) check component.
    expect(
      mockedEarlySecurityChecks.mock.calls.some(call => call[0].device.deviceId === "device-b"),
    ).toBe(false);
  });

  it("does not reset when the same device is dispatched again", () => {
    const { store, resetStates } = renderScreen(deviceA);
    const callsBeforeRedispatch = mockedEarlySecurityChecks.mock.calls.length;

    act(() => {
      store.dispatch(addDevice({ ...deviceA }));
    });

    expect(resetStates).not.toHaveBeenCalled();
    expect(lastRenderedDeviceProp()?.deviceId).toBe("device-a");
    expect(mockedEarlySecurityChecks.mock.calls.length).toBeGreaterThanOrEqual(
      callsBeforeRedispatch,
    );
  });
});
