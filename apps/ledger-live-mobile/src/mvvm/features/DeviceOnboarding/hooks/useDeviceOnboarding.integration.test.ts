import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@ledgerhq/device-onboarding";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { createTestDevice, knownStax } from "../testing/testDevice";
import { useDeviceOnboarding } from "./useDeviceOnboarding";

jest.mock("./useDeviceOnboardingExit", () => ({
  useDeviceOnboardingExit: jest.fn(),
}));

jest.mock("./useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(),
}));

describe("device onboarding integration", () => {
  it("drives a new device from connection to ready", async () => {
    const device = createTestDevice();
    const { result } = renderHook(() =>
      useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    );

    await connectToGenuineCheck(result, device);
    await finishSetup(result, device);

    expect(result.current.exit).toEqual({
      reason: "completed",
      sessionId: device.sessionId,
      modelId: DeviceModelId.STAX,
    });
    expect(device.isWatching(device.sessionId)).toBe(true);
    expect(device.dmk.sendCommand).toHaveBeenCalledTimes(4);
    expect(device.dmk.executeDeviceAction).toHaveBeenCalledTimes(2);
  });
});

type HookResult = { current: ReturnType<typeof useDeviceOnboarding> };

async function connectToGenuineCheck(
  result: HookResult,
  device: ReturnType<typeof createTestDevice>,
) {
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
  device.show();
  act(() => result.current.connect());

  await waitFor(() => expect(result.current.state).toBe("awaitingStart"));
  expect(device.isWatching(device.sessionId)).toBe(true);

  device.acceptToggle();
  act(() => result.current.send({ type: "CONTINUE" }));
  await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck"));
}

async function finishSetup(result: HookResult, device: ReturnType<typeof createTestDevice>) {
  act(() => device.passGenuineCheck());
  await waitFor(() => expect(result.current.state).toBe("checks.firmwareCheck"));

  device.acceptToggle();
  act(() => device.reportFirmwareUpToDate());
  await waitFor(() => expect(result.current.state).toBe("deviceSetup.waiting"));

  act(() =>
    device.answerState({
      onboardingState: OnboardingStep.Ready,
      numberOfWords: 24,
      currentWordIndex: 0,
      isOnboarded: true,
    }),
  );
  await waitFor(() => expect(result.current.status).toBe("exited"));
}
