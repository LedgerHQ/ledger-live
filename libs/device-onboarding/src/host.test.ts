import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createDelegatedPorts,
  createOnboardingEventLog,
  flattenDeviceOnboardingContext,
  recordOnboardingToolEvent,
  stateValueToString,
  toolEvent,
} from "./host";
import type { DeviceOnboardingPorts } from "./ports";
import type {
  AvailableFirmwareUpdate,
  DeviceOnboardingContext,
  DeviceOnboardingState,
} from "./types";
import { OnboardingStep, RecoveryKeyStatus } from "./types";

function ports(sessionId = "session-1"): DeviceOnboardingPorts {
  return {
    openSession: jest.fn(),
    currentSessionId: () => sessionId,
    closeSession: jest.fn(async () => undefined),
  };
}

function deviceState(step: OnboardingStep): DeviceOnboardingState {
  return {
    isOnboarded: false,
    isInRecoveryMode: true,
    managerAllowed: true,
    currentOnboardingStep: step,
    seedWordIndex: 0,
    seedPhraseWordCount: 24,
    recoveryKeyStatus: null,
  };
}

function context(overrides: Partial<DeviceOnboardingContext> = {}): DeviceOnboardingContext {
  return {
    dmk: {} as DeviceOnboardingContext["dmk"],
    ports: ports(),
    deviceId: "device",
    deviceModelId: DeviceModelId.NANO_X,
    offerSync: true,
    lastDeviceState: null,
    firmwareVersion: "2.2.0",
    hasStarted: true,
    isOnboarded: false,
    onboardedOnEntry: false,
    genuineVerdict: null,
    secureConnectionRequested: false,
    lastGenuineFailure: null,
    onEarlyCheckScreen: false,
    firmwareChecked: false,
    checksPaused: false,
    availableFirmwareUpdate: null,
    currentSetupStep: null,
    ...overrides,
  };
}

describe("flattenDeviceOnboardingContext", () => {
  it("should leave verdict fields empty when the machine has no verdict", () => {
    const flattened = flattenDeviceOnboardingContext(context());

    expect(flattened.isGenuine).toBeNull();
    expect(flattened.verdictMatchesSession).toBeNull();
    expect(flattened.genuineFailureKind).toBeNull();
    expect(flattened.isInRecoveryMode).toBeNull();
    expect(flattened.availableFirmwareVersion).toBeNull();
  });

  it("should compare the verdict session with the live session id", () => {
    const flattened = flattenDeviceOnboardingContext(
      context({
        lastDeviceState: deviceState(OnboardingStep.Pin),
        genuineVerdict: { sessionId: "session-1", isGenuine: true },
        lastGenuineFailure: { kind: "GENUINE_CHECK_FAILED", failure: null },
        availableFirmwareUpdate: {
          finalFirmware: { version: "2.3.0" },
        } as unknown as DeviceOnboardingContext["availableFirmwareUpdate"],
        currentSetupStep: OnboardingStep.Pin,
      }),
    );

    expect(flattened.verdictMatchesSession).toBe(true);
    expect(flattened.isGenuine).toBe(true);
    expect(flattened.genuineFailureKind).toBe("GENUINE_CHECK_FAILED");
    expect(flattened.currentOnboardingStep).toBe(OnboardingStep.Pin);
    expect(flattened.availableFirmwareVersion).toBe("2.3.0");
    expect(flattened.managerAllowed).toBe(true);
  });

  it("should report a mismatch when the verdict belongs to another session", () => {
    const flattened = flattenDeviceOnboardingContext(
      context({
        genuineVerdict: { sessionId: "other-session", isGenuine: false },
      }),
    );

    expect(flattened.verdictMatchesSession).toBe(false);
    expect(flattened.isGenuine).toBe(false);
  });
});

describe("stateValueToString", () => {
  it("should return a string state unchanged", () => {
    expect(stateValueToString("readingState")).toBe("readingState");
  });

  it("should stringify a non-object state", () => {
    expect(stateValueToString(null)).toBe("null");
    expect(stateValueToString(false)).toBe("false");
  });

  it("should join nested state keys and drop an empty child", () => {
    expect(stateValueToString({ checks: { firmware: "delegated" }, idle: "" })).toBe(
      "checks.firmware.delegated,idle",
    );
  });
});

describe("toolEvent", () => {
  let now: jest.SpiedFunction<typeof Date.now>;

  beforeEach(() => {
    now = jest.spyOn(Date, "now").mockReturnValue(100);
  });

  afterEach(() => {
    now.mockRestore();
  });

  it("should attach the onboarding step when the step changes", () => {
    expect(
      toolEvent({ type: "STEP_CHANGED", state: deviceState(OnboardingStep.Pin) }, "1", "session-1"),
    ).toEqual({
      id: "1",
      type: "STEP_CHANGED",
      at: 100,
      detail: { kind: "step", step: OnboardingStep.Pin },
    });
  });

  it("should attach the firmware version when an update is available", () => {
    expect(
      toolEvent(
        {
          type: "FIRMWARE_UPDATE_AVAILABLE",
          update: {
            finalFirmware: { version: "2.3.0" },
          } as unknown as AvailableFirmwareUpdate,
        },
        "2",
        "session-1",
      ),
    ).toEqual({
      id: "2",
      type: "FIRMWARE_UPDATE_AVAILABLE",
      at: 100,
      detail: { kind: "firmware", version: "2.3.0" },
    });
  });

  it("should attach the session id when the session is ready or the transport is lost", () => {
    expect(toolEvent({ type: "SESSION_READY" }, "3", "session-1").detail).toEqual({
      kind: "session",
      sessionId: "session-1",
    });
    expect(toolEvent({ type: "TRANSPORT_LOST" }, "4", "session-2").detail).toEqual({
      kind: "session",
      sessionId: "session-2",
    });
  });

  it("should omit detail for a user event", () => {
    expect(toolEvent({ type: "RETRY" }, "5", "session-1").detail).toBeUndefined();
  });
});

describe("recordOnboardingToolEvent", () => {
  it("should skip a step the panel already logged", () => {
    const recorded = recordOnboardingToolEvent(
      { type: "STEP_CHANGED", state: deviceState(OnboardingStep.Pin) },
      "1",
      "session-1",
      `${OnboardingStep.Pin}:`,
    );

    expect(recorded.entry).toBeNull();
    expect(recorded.step).toBe(`${OnboardingStep.Pin}:`);
  });

  it("should log a recovery key change on the same step", () => {
    const recorded = recordOnboardingToolEvent(
      {
        type: "STEP_CHANGED",
        state: { ...deviceState(OnboardingStep.Ready), recoveryKeyStatus: RecoveryKeyStatus.Choice },
      },
      "1",
      "session-1",
      `${OnboardingStep.Ready}:`,
    );

    expect(recorded.entry?.type).toBe("STEP_CHANGED");
    expect(recorded.step).toBe(`${OnboardingStep.Ready}:${RecoveryKeyStatus.Choice}`);
  });

  it("should log a new step and keep the previous step for other events", () => {
    const changed = recordOnboardingToolEvent(
      { type: "STEP_CHANGED", state: deviceState(OnboardingStep.Ready) },
      "2",
      "session-1",
      `${OnboardingStep.Pin}:`,
    );
    const retried = recordOnboardingToolEvent({ type: "RETRY" }, "3", "session-1", changed.step);

    expect(changed.entry?.detail).toEqual({ kind: "step", step: OnboardingStep.Ready });
    expect(retried.step).toBe(`${OnboardingStep.Ready}:`);
    expect(retried.entry?.type).toBe("RETRY");
  });
});

describe("createOnboardingEventLog", () => {
  it("should skip a repeated step and append the next event", () => {
    const lastLoggedStep: { current: string | null } = { current: null };
    const sequence = { current: 0 };
    const entries: Array<{ type: string }> = [];
    const log = createOnboardingEventLog({
      currentSessionId: () => undefined,
      lastLoggedStep,
      sequence,
      push: entry => entries.push(entry),
    });

    log({ type: "STEP_CHANGED", state: deviceState(OnboardingStep.Pin) });
    log({ type: "STEP_CHANGED", state: deviceState(OnboardingStep.Pin) });
    log({ type: "RETRY" });

    expect(entries.map(entry => entry.type)).toEqual(["STEP_CHANGED", "RETRY"]);
    expect(sequence.current).toBe(2);
    expect(lastLoggedStep.current).toBe(`${OnboardingStep.Pin}:`);
  });
});

describe("createDelegatedPorts", () => {
  it("should throw when the host has no session", () => {
    const delegated = createDelegatedPorts(() => null, "No onboarding session");

    expect(() => delegated.openSession()).toThrow("No onboarding session");
    expect(() => delegated.currentSessionId()).toThrow("No onboarding session");
  });

  it("should close without a session and forward calls when one exists", async () => {
    const current = ports();
    const delegated = createDelegatedPorts(() => current, "No onboarding session");

    await expect(
      createDelegatedPorts(() => null, "missing").closeSession(),
    ).resolves.toBeUndefined();
    await delegated.openSession();
    expect(current.openSession).toHaveBeenCalledTimes(1);
    expect(delegated.currentSessionId()).toBe("session-1");
    await delegated.closeSession();
    expect(current.closeSession).toHaveBeenCalledTimes(1);
  });
});
