import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createOnboardingEventLog,
  flattenDeviceOnboardingContext,
  nextStatesFrom,
  recordOnboardingToolEvent,
  stampSession,
  stateValueToString,
  toolContext,
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
    hostsSeedSetup: false,
    lastDeviceState: null,
    firmwareVersion: "2.2.0",
    hasStarted: true,
    isOnboarded: false,
    onboardedOnEntry: false,
    genuineVerdict: null,
    lastGenuineFailure: null,
    onEarlyCheckScreen: false,
    checksPaused: false,
    successAcknowledgedOnSession: null,
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
    expect(flattened.firmwareUpToDate).toBeNull();
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
    expect(flattened.firmwareUpToDate).toBeNull();
    expect(flattened.secureConnectionRequested).toBe(true);
  });

  it.each(["upToDate", "declined", "skipped"] as const)(
    "should report a settled firmware check of %s",
    kind => {
      const flattened = flattenDeviceOnboardingContext(snapshot({ firmware: { kind } }));

      expect(flattened.firmwareChecked).toBe(true);
      expect(flattened.firmwareUpToDate).toBe(kind === "upToDate");
      expect(flattened.availableFirmwareVersion).toBeNull();
    },
  );
});

describe("toolContext", () => {
  it("copies the context without the kit, the hardware id and the seed", () => {
    const copied = toolContext(
      context({
        lastDeviceState: deviceState(OnboardingStep.Pin),
        lastGenuineFailure: { kind: "GENUINE_CHECK_FAILED", failure: { status: 500 } },
      }),
    ) as Record<string, unknown>;

    expect(copied).not.toHaveProperty("dmk");
    expect(copied).not.toHaveProperty("deviceId");
    expect(copied).not.toHaveProperty("lastDeviceState");
    expect(copied).toMatchObject({
      lastGenuineFailure: { kind: "GENUINE_CHECK_FAILED", failure: { status: 500 } },
      verdictMatchesSession: null,
    });
  });

  it("tells whether the verdict belongs to the current session", () => {
    const matching = toolContext(
      context({ genuineVerdict: { sessionId: "session-1", isGenuine: true } }),
    );
    const moved = toolContext(
      context({ genuineVerdict: { sessionId: "other-session", isGenuine: false } }),
    );

    expect(matching).toMatchObject({ verdictMatchesSession: true });
    expect(moved).toMatchObject({ verdictMatchesSession: false });
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
    expect(stampSession({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" }, () => "session-2")).toEqual({
      type: "FIRMWARE_UPDATE_FLOW_CLOSED",
      sessionId: "session-2",
    });
  });

  it("should leave the other events as they are", () => {
    const event = { type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" } as const;

    const sessionId = jest.fn(() => "session-2");

    expect(stampSession(event, sessionId)).toBe(event);
    expect(sessionId).not.toHaveBeenCalled();
  });
});

describe("nextStatesFrom", () => {
  it("lists an accepted event that keeps the current state", () => {
    const snapshot = {
      status: "active",
      value: { checks: "checksIdle" },
    } as Parameters<typeof nextStatesFrom>[0];

    const rows = nextStatesFrom(snapshot);

    expect(rows).toContainEqual({ event: "RETRY", state: "checks.checksIdle" });
    expect(rows.map(row => row.event)).not.toContain("SESSION_CHANGED");
  });

  // Reads xstate's node tree (`transitions`, `always`, guards). These pin a whole answer, so an
  // xstate upgrade that changes that tree fails here instead of showing QA a wrong list.
  it("lists every way out of reading the device state", () => {
    const snapshot = { status: "active", value: "readingState" } as Parameters<
      typeof nextStatesFrom
    >[0];

    expect(nextStatesFrom(snapshot)).toEqual([
      { event: "DEVICE_STATE_READ", state: "routing" },
      { event: "DEVICE_STATE_UNREADABLE", state: "routing" },
      { event: "DEVICE_STATE_FAILED", state: "legacyFallback" },
      { event: "DEVICE_IN_BOOTLOADER", state: "bootloaderRecovery" },
      { event: "DEVICE_IN_OSU", state: "bootloaderRecovery" },
    ]);
  });

  it("lists each guarded move of routing once, as auto", () => {
    const snapshot = { status: "active", value: "routing" } as Parameters<typeof nextStatesFrom>[0];

    expect(nextStatesFrom(snapshot)).toEqual([
      { event: "auto", state: "checks.notGenuineSupport" },
      { event: "auto", state: "legacyFallback" },
      { event: "auto", state: "awaitingStart" },
      { event: "auto", state: "checks.enteringEarlyCheckScreen" },
      { event: "auto", state: "checks.checksIdle" },
    ]);
  });

  it("lists the state a firmware update can return to", () => {
    const snapshot = {
      status: "active",
      value: { checks: "firmwareUpdateDelegated" },
    } as Parameters<typeof nextStatesFrom>[0];

    expect(nextStatesFrom(snapshot)).toEqual([
      {
        event: "FIRMWARE_UPDATE_RECONNECT_REQUIRED",
        state: "awaitingSessionAfterFirmwareUpdate",
      },
      { event: "FIRMWARE_UPDATE_FLOW_CLOSED", state: "readingState" },
    ]);
  });

  it("lists the new session as the only way out of the post-update wait", () => {
    const snapshot = {
      status: "active",
      value: "awaitingSessionAfterFirmwareUpdate",
    } as Parameters<typeof nextStatesFrom>[0];

    expect(nextStatesFrom(snapshot)).toEqual([{ event: "SESSION_READY", state: "readingState" }]);
  });
});

describe("toolEvent payload", () => {
  it("keeps the error body and a url", () => {
    const row = toolEvent(
      { type: "GENUINE_CHECK_FAILED", failure: new Error("https://secret.example/body") },
      "1",
      "session",
    );

    expect(row.payload).toEqual({
      failure: { name: "Error", message: "https://secret.example/body" },
    });
  });

  it("counts the installed apps without naming them, and drops the catalog", () => {
    const update = { finalFirmware: { version: "1.5.0" } };
    const event = {
      type: "FIRMWARE_UPDATE_AVAILABLE",
      output: {
        firmwareVersion: { os: "1.4.0", mcu: "2.0.0", bootloader: "3.0.0" },
        firmwareUpdateContext: { availableUpdate: update },
        applications: [
          { versionName: "Bitcoin", bytes: 100, isDevTools: false, warning: null },
          { versionName: "Ethereum", bytes: 50, isDevTools: true, warning: "old" },
        ],
        applicationsUpdates: [{ versionName: "Bitcoin" }],
        catalog: { applications: [{ versionName: "Solana" }], languagePackages: [] },
      },
    } as unknown as OnboardingEvent;
    const row = toolEvent(event, "1", "session");

    expect(row.detail).toEqual({ kind: "firmware", version: "1.5.0" });
    expect(JSON.stringify(row.payload)).not.toMatch(/Bitcoin|Ethereum|Solana|catalog/);
    expect(row.payload).toMatchObject({
      output: {
        apps: { count: 2, updates: 1, bytes: 150, devTools: 1, withWarning: 1 },
        firmwareUpdateContext: { availableUpdate: update },
      },
    });
  });

  it("keeps a firmware's id, version and size, and counts the languages", () => {
    const final = {
      id: 7,
      version: "1.5.0",
      perso: "perso_11",
      firmware: "nanox/1.5.0/fw",
      firmwareKey: "nanox/1.5.0/key",
      hash: "abc",
      bytes: 1024,
      mcuVersions: [1, 2],
    };
    const event = {
      type: "FIRMWARE_UP_TO_DATE",
      output: {
        firmwareUpdateContext: { currentFirmware: final },
        installedLanguages: [
          { id: 1, size: 10 },
          { id: 2, size: 20 },
        ],
      },
    } as unknown as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: {
        firmwareUpdateContext: {
          currentFirmware: { id: 7, version: "1.5.0", bytes: 1024, mcuVersions: [1, 2] },
        },
        installedLanguages: 2,
      },
    });
  });

  it("hides the seed progress in a device state event", () => {
    const row = toolEvent(
      { type: "STEP_CHANGED", state: deviceState(OnboardingStep.RestoreSeed) },
      "1",
      "session",
    );

    expect(row.payload).toEqual({
      state: {
        isOnboarded: false,
        isInRecoveryMode: true,
        managerAllowed: true,
        currentOnboardingStep: OnboardingStep.RestoreSeed,
        recoveryKeyStatus: null,
      },
    });
  });

  it("shows a field whose getter throws as …, and copies the rest", () => {
    const failure = { status: 500 };
    Object.defineProperty(failure, "body", {
      enumerable: true,
      get() {
        throw new Error("unreadable");
      },
    });
    const event = { type: "FIRMWARE_CHECK_FAILED", output: failure } as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: { status: 500, body: "…" },
    });
  });

  it("shows a throwing getter as … even on a key the copy checks, like firmware", () => {
    const failure = {};
    Object.defineProperty(failure, "firmware", {
      enumerable: true,
      get() {
        throw new Error("unreadable");
      },
    });
    const event = { type: "FIRMWARE_CHECK_FAILED", output: failure } as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({ output: { firmware: "…" } });
  });

  it("keeps a fetch error once when it is also its original error", () => {
    const cause = { status: 502, body: "Bad gateway" };
    const event = {
      type: "FIRMWARE_CHECK_FAILED",
      output: { _tag: "FetchError", error: cause, originalError: cause },
    } as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: { _tag: "FetchError", error: { status: 502, body: "Bad gateway" } },
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

  it("keeps an empty object", () => {
    const event = {
      type: "FIRMWARE_UP_TO_DATE",
      output: { customImage: {}, apps: [{}] },
    } as unknown as OnboardingEvent;

    expect(toolEvent(event, "1", "session").payload).toEqual({
      output: { customImage: {}, apps: [{}] },
    });
  });
});
