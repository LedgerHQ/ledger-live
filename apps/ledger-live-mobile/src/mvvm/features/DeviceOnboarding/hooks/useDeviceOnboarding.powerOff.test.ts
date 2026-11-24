import { OnboardingStep } from "@features/platform-device-onboarding";
import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useDeviceOnboardingToolSession } from "../../DevTools/DeviceOnboarding/useDeviceOnboardingTool";
import { createScriptedTestDevice } from "../testing/scriptedTestDevice";
import { knownStax } from "../testing/testDevice";

jest.mock("./useLeaveOnboarding", () => ({
  useLeaveOnboarding: () => jest.fn(),
}));

async function startChecksThenSwitchOff() {
  const device = createScriptedTestDevice();
  const { result } = renderHook(
    () => useOnboardingWithTool({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
    {
      overrideInitialState: withFlagOverrides({
        deviceOnboarding: { enabled: true, params: { connectUnseededDevice: true } },
      }),
    },
  );
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
  device.show();
  act(() => result.current.connect());
  await waitFor(() => expect(result.current.state).toBe("awaitingStart"));
  device.acceptToggle();
  act(() => result.current.send({ type: "CONTINUE" }));
  await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck.running"));

  device.hide();
  act(() => device.unplug());
  await waitFor(() => expect(result.current.state).toBe("awaitingSession"));

  return { device, result };
}

describe("useDeviceOnboarding when the device switches off during checks", () => {
  it("adopts the new session once the device is back", async () => {
    const { device, result } = await startChecksThenSwitchOff();
    act(() => result.current.connect(knownStax.id));

    device.setSession("session-2");
    device.show();

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.error).toBeNull();
  });

  it("does not adopt a connection to another device", async () => {
    const { device, result } = await startChecksThenSwitchOff();
    act(() => result.current.connect("another-device-id"));

    device.setSession("session-2");
    device.show();

    await waitFor(() => expect(result.current.error).toBe("Unable to reconnect to the device"));
    expect(device.disconnect).toHaveBeenCalledWith({ sessionId: "session-2" });
    expect(result.current.device?.sessionId).not.toBe("session-2");
    expect(result.current.state).toBe("awaitingSession");
  });
});

function useOnboardingWithTool(input: Parameters<typeof useDeviceOnboardingToolSession>[0]) {
  const { session, toolState } = useDeviceOnboardingToolSession(input);
  return { ...session, ...toolState };
}
