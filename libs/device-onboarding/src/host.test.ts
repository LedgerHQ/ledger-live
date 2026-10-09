import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createOnboardingEventLog,
  flattenDeviceOnboardingContext,
  nextStatesFrom,
  recordOnboardingToolEvent,
  stampSession,
  stateValueToString,
  toolEvent,
  type HostToolEvent,
} from "./host";
import type {
  AvailableFirmwareUpdate,
  DeviceOnboardingContext,
  DeviceOnboardingState,
  OnboardingEvent,
} from "./types";
import { OnboardingStep, RecoveryKeyStatus } from "./types";

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
    sessionId: "session-1",
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
    recoveryKeyBackupOpen: overrides.recoveryKeyBackupOpen ?? false,
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
    ).toMatchObject({
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
          output: {
            firmwareUpdateContext: {
              availableUpdate: { finalFirmware: { version: "2.3.0" } } as AvailableFirmwareUpdate,
            },
          },
        } as OnboardingEvent,
        "2",
        "session-1",
      ),
    ).toMatchObject({
      id: "2",
      type: "FIRMWARE_UPDATE_AVAILABLE",
      at: 100,
      detail: { kind: "firmware", version: "2.3.0" },
    });
  });

  it("should attach the session id when the session is ready or the transport is lost", () => {
    expect(
      toolEvent({ type: "SESSION_READY", sessionId: "session-1" }, "3", "session-1").detail,
    ).toEqual({
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
        state: {
          ...deviceState(OnboardingStep.Ready),
          recoveryKeyStatus: RecoveryKeyStatus.Choice,
        },
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

  it("should log the event when the live session is missing", () => {
    const entries: HostToolEvent[] = [];
    const log = createOnboardingEventLog({
      currentSessionId: () => {
        throw new Error("No desktop onboarding session");
      },
      lastLoggedStep: { current: null },
      sequence: { current: 0 },
      push: entry => entries.push(entry),
    });

    log({ type: "TRANSPORT_LOST" });

    expect(entries).toEqual([
      expect.objectContaining({
        type: "TRANSPORT_LOST",
        detail: { kind: "session", sessionId: "unavailable" },
      }),
    ]);
  });
});

describe("stampSession", () => {
  it("should give the session events the host's session id", () => {
    expect(stampSession({ type: "SESSION_READY" }, () => "session-2")).toEqual({
      type: "SESSION_READY",
      sessionId: "session-2",
    });
    expect(
      stampSession({ type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "stale" }, () => "session-2"),
    ).toEqual({
      type: "FIRMWARE_UPDATE_FLOW_CLOSED",
      sessionId: "session-2",
    });
  });

  it("should leave the other events as they are", () => {
    const event = { type: "RETRY" } as const;

    const sessionId = jest.fn(() => "session-2");

    expect(stampSession(event, sessionId)).toBe(event);
    expect(sessionId).not.toHaveBeenCalled();
  });
});

describe("nextStatesFrom", () => {
  it("lists the state a firmware update can return to", () => {
    const snapshot = {
      status: "active",
      value: { checks: "firmwareUpdateDelegated" },
    } as Parameters<typeof nextStatesFrom>[0];

    expect(nextStatesFrom(snapshot)).toEqual([
      { event: "FIRMWARE_UPDATE_FLOW_CLOSED", state: "readingState" },
    ]);
  });
});

describe("toolEvent payload", () => {
  it("keeps the error body and a url", () => {
    const row = toolEvent(
      { type: "GENUINE_CHECK_FAILED", output: new Error("https://secret.example/body") },
      "1",
      "session",
    );

    expect(row.payload).toEqual({
      output: { name: "Error", message: "https://secret.example/body" },
    });
  });

  it("keeps the installed apps on a firmware event", () => {
    const event = {
      type: "FIRMWARE_UPDATE_AVAILABLE",
      output: {
        firmwareVersion: { os: "1.4.0", mcu: "2.0.0", bootloader: "3.0.0" },
        firmwareUpdateContext: {
          availableUpdate: { finalFirmware: { version: "1.5.0" } },
        },
        applications: [{ versionName: "Bitcoin" }],
      },
    } as OnboardingEvent;
    const row = toolEvent(event, "1", "session");

    expect(row.detail).toEqual({ kind: "firmware", version: "1.5.0" });
    expect(row.payload).toMatchObject({
      output: { applications: [{ versionName: "Bitcoin" }] },
    });
  });

  it("keeps arrays as arrays", () => {
    const event = {
      type: "FIRMWARE_UP_TO_DATE",
      output: { mcuVersions: ["1.1.0"] },
    } as unknown as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: { mcuVersions: ["1.1.0"] },
    });
  });

  it("stops on an object that points back to itself", () => {
    const failure: Record<string, unknown> = { status: 500 };
    failure.request = failure;
    const event = { type: "FIRMWARE_CHECK_FAILED", output: failure } as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: { status: 500, request: "…" },
    });
  });

  it("stops copying once the payload is too large to draw", () => {
    const event = {
      type: "FIRMWARE_UP_TO_DATE",
      output: { applications: Array.from({ length: 600 }, (_, index) => `app-${index}`) },
    } as unknown as OnboardingEvent;
    const payload = toolEvent(event, "1", "session").payload as {
      output: { applications: unknown[] };
    };

    expect(payload.output.applications).toContain("…");
  });
});
