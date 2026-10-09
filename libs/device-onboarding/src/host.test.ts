import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createOnboardingEventLog,
  flattenDeviceOnboardingContext,
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
    lastGenuineFailure: null,
    onEarlyCheckScreen: false,
    checksPaused: false,
    firmware: null,
    currentSetupStep: null,
    ...overrides,
    recoveryKeyBackupOpen: overrides.recoveryKeyBackupOpen ?? false,
  };
}

function snapshot(
  overrides: Partial<DeviceOnboardingContext> = {},
  awaitingApproval = false,
): Parameters<typeof flattenDeviceOnboardingContext>[0] {
  return {
    context: context(overrides),
    matches: () => awaitingApproval,
  } as unknown as Parameters<typeof flattenDeviceOnboardingContext>[0];
}

describe("flattenDeviceOnboardingContext", () => {
  it("should leave verdict and firmware fields empty when the machine has none", () => {
    const flattened = flattenDeviceOnboardingContext(snapshot());

    expect(flattened.isGenuine).toBeNull();
    expect(flattened.verdictMatchesSession).toBeNull();
    expect(flattened.availableFirmwareVersion).toBeNull();
    expect(flattened.firmwareChecked).toBe(false);
    expect(flattened.secureConnectionRequested).toBe(false);
  });

  it("should compare the verdict session with the machine session", () => {
    const matching = flattenDeviceOnboardingContext(
      snapshot({ genuineVerdict: { sessionId: "session-1", isGenuine: true } }),
    );
    const moved = flattenDeviceOnboardingContext(
      snapshot({ genuineVerdict: { sessionId: "other-session", isGenuine: false } }),
    );

    expect(matching.verdictMatchesSession).toBe(true);
    expect(moved.verdictMatchesSession).toBe(false);
  });

  it("should read the offered firmware and the secure connection prompt", () => {
    const update = { finalFirmware: { version: "2.3.0" } } as AvailableFirmwareUpdate;
    const flattened = flattenDeviceOnboardingContext(
      snapshot({ firmware: { kind: "offered", update } }, true),
    );

    expect(flattened.availableFirmwareVersion).toBe("2.3.0");
    expect(flattened.firmwareChecked).toBe(false);
    expect(flattened.secureConnectionRequested).toBe(true);
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
    expect(stampSession({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" }, () => "session-2")).toEqual({
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
