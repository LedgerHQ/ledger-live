import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { OnboardingStep } from "@ledgerhq/device-onboarding";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { createTestDevice, knownStax } from "../testing/testDevice";
import { useDeviceOnboarding } from "./useDeviceOnboarding";

const loggedEvents: { type: string }[] = [];

jest.mock("@ledgerhq/device-onboarding", () => {
  const actual = jest.requireActual("@ledgerhq/device-onboarding");
  return {
    ...actual,
    createOnboardingEventLog: (deps: { push: (entry: { type: string }) => void }) =>
      actual.createOnboardingEventLog({
        ...deps,
        push: (entry: { type: string }) => {
          loggedEvents.push(entry);
          deps.push(entry);
        },
      }),
  };
});

jest.mock("./useDeviceOnboardingExit", () => ({
  useDeviceOnboardingExit: jest.fn(),
}));

jest.mock("./useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(),
}));

describe("device onboarding integration", () => {
  beforeEach(() => {
    loggedEvents.length = 0;
  });

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

  it("keeps asking until the secure connection prompt goes away", async () => {
    const device = createTestDevice();
    const { result } = renderOnboarding(device);
    await connectToGenuineCheck(result, device);

    act(() => device.requestSecureConnection());
    await waitFor(() => expect(result.current.context?.secureConnectionRequested).toBe(true));

    act(() => device.requestSecureConnection());
    expect(loggedEvents.filter(event => event.type === "SECURE_CONNECTION_ALLOWED")).toHaveLength(
      0,
    );

    act(() => device.allowSecureConnection());
    await waitFor(() => expect(result.current.context?.secureConnectionRequested).toBe(false));
    expect(loggedEvents.filter(event => event.type === "SECURE_CONNECTION_ALLOWED")).toHaveLength(
      1,
    );

    await finishSetup(result, device);
    expect(result.current.exit?.reason).toBe("completed");
  });

  it("retries a failed genuine check", async () => {
    const device = createTestDevice();
    const { result } = renderOnboarding(device);
    await connectToGenuineCheck(result, device);

    act(() => device.failGenuineCheck());
    await waitFor(() => expect(result.current.state).toBe("checks.genuineFailed"));

    act(() => result.current.send({ type: "RETRY" }));
    await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck"));

    await finishSetup(result, device);
    expect(result.current.exit?.reason).toBe("completed");
  });

  it("watches a new session before it resumes after transport loss", async () => {
    const device = createTestDevice();
    const { result } = renderOnboarding(device);
    await connectToGenuineCheck(result, device);
    const oldSession = device.sessionId;

    act(() => device.unplug());
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(device.isWatching(oldSession)).toBe(false);

    device.setSession("session-2");
    device.show();
    act(() => result.current.connect());
    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));

    expect(device.isWatching("session-2")).toBe(true);
    expect(result.current.sendableEvents).toEqual(
      expect.arrayContaining([{ event: { type: "SESSION_READY" } }]),
    );

    answerWelcome(device);
    device.acceptToggle();
    act(() => result.current.send({ type: "SESSION_READY" }));
    await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck"));

    await finishSetup(result, device);
    expect(result.current.exit).toMatchObject({ reason: "completed", sessionId: "session-2" });
  });
});

type HookResult = { current: ReturnType<typeof useDeviceOnboarding> };

function renderOnboarding(device: ReturnType<typeof createTestDevice>) {
  return renderHook(() =>
    useDeviceOnboarding({ dmk: device.dmk, knownDevices: [knownStax], offerSync: false }),
  );
}

async function connectToGenuineCheck(
  result: HookResult,
  device: ReturnType<typeof createTestDevice>,
) {
  answerWelcome(device);
  device.show();
  act(() => result.current.connect());

  await waitFor(() => expect(result.current.state).toBe("awaitingStart"));
  expect(device.isWatching(device.sessionId)).toBe(true);

  device.acceptToggle();
  act(() => result.current.send({ type: "CONTINUE" }));
  await waitFor(() => expect(result.current.state).toBe("checks.genuineCheck"));
}

function answerWelcome(device: ReturnType<typeof createTestDevice>) {
  device.answerState({
    onboardingState: OnboardingStep.WelcomeScreen1,
    numberOfWords: 24,
    currentWordIndex: 0,
  });
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
