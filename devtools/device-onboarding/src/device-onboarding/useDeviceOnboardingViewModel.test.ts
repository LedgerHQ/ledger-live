import { act, renderHook } from "@testing-library/react";
import { buildProps, sampleMachine } from "jest/deviceOnboardingProps";
import type { DeviceOnboardingToolPayload } from "../types";
import { logCopy, machineCopy, statusCopy } from "./configCopy";
import {
  FirmwareOverride,
  GenuineOverride,
  formatTime,
  formatValue,
  machineRowsOf,
  stateKind,
  useDeviceOnboardingViewModel,
  type LogLine,
} from "./useDeviceOnboardingViewModel";

function eventIds(lines: readonly LogLine[]) {
  return lines.flatMap(line => (line.line === "event" ? [line.id] : []));
}

function quitPayload(lines: readonly LogLine[]) {
  const quit = lines.find(line => line.line === "event" && line.type === "QUIT");
  return quit?.line === "event" ? quit.payload : [];
}

function buildLog(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    state: "readingState",
    event: {
      id: `event-${index}`,
      type: "CONTINUE" as const,
      at: index,
    },
  }));
}

describe("machineRowsOf", () => {
  it("highlights the current state and its parents", () => {
    const rows = machineRowsOf(sampleMachine, "checks.checksIdle");

    expect(rows.map(row => [row.label, row.emphasis])).toEqual([
      ["deviceOnboarding", "active"],
      ["checks", "active"],
      ["checksIdle", "current"],
      ["firmwareCheck", "idle"],
    ]);
  });

  it("highlights nothing before the machine starts", () => {
    const rows = machineRowsOf(sampleMachine, null);

    expect(rows.every(row => row.emphasis === "idle")).toBe(true);
  });

  it("marks the root, the initial state and what a state runs", () => {
    const [root, checks, idle, firmware] = machineRowsOf(sampleMachine, null);

    expect(root.badges).toEqual([{ label: machineCopy.root, tone: "muted" }]);
    expect(checks.badges).toEqual([]);
    expect(idle.badges).toEqual([{ label: machineCopy.initial, tone: "success" }]);
    expect(firmware.badges).toEqual([{ label: "runs firmwareCheck", tone: "active" }]);
  });

  it("colors each event by who sends it, and says where it leads", () => {
    const [root, , idle] = machineRowsOf(sampleMachine, null);

    expect(root.transitions).toEqual([
      { key: "0-LOCKED", event: "LOCKED", tone: "warning", target: "deviceLocked", guard: null },
    ]);
    expect(idle.transitions).toEqual([
      {
        key: "0-auto",
        event: "auto",
        tone: "muted",
        target: "checks.genuineCheck",
        guard: "shouldRunGenuineCheck",
      },
      { key: "1-RETRY", event: "RETRY", tone: "active", target: null, guard: null },
    ]);
  });
});

describe("formatValue", () => {
  it.each([
    ["", "—"],
    ["welcome-screen-1", "welcome-screen-1"],
    [null, "null"],
    [false, "false"],
    [0, "0"],
  ])("formats %p as %p", (value, expected) => {
    expect(formatValue(value)).toBe(expected);
  });
});

describe("formatTime", () => {
  it("pads every part so the log stays aligned", () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 8, 7, 6).getTime())).toBe("09:08:07.006");
  });

  it("marks a timestamp it cannot read rather than printing NaN", () => {
    expect(formatTime(Number.NaN)).toBe("—");
    expect(formatTime(Number.MAX_SAFE_INTEGER)).toBe("—");
  });
});

describe("stateKind", () => {
  it.each([
    ["readingState", "progress"],
    ["routing", "progress"],
    ["checks.checksIdle", "progress"],
    ["checks.genuineCheck", "genuine"],
    ["checks.enteringEarlyCheckScreen", "genuine"],
    ["checks.firmwareCheck", "firmware"],
    ["checks.firmwareUpdateOffered", "firmware"],
    ["deviceSetup.restoreWords", "setup"],
    ["deviceLocked", "locked"],
    ["awaitingSession", "session"],
    ["checks.genuineFailed", "failed"],
    ["checks.firmwareCheckFailed", "failed"],
    ["bootloaderRecovery", "failed"],
    ["legacyFallback", "failed"],
    ["checks.checksSucceeded", "succeeded"],
    ["done", "succeeded"],
    ["syncOffer", "succeeded"],
    ["exitOnboarding", "quit"],
    ["leavingOnQuit", "quit"],
  ])("classifies %p as %p", (state, expected) => {
    expect(stateKind(state)).toBe(expected);
  });

  it("falls back to progress on a state it does not know, rather than dropping the step", () => {
    expect(stateKind("somethingAddedLater")).toBe("progress");
  });

  it("reads a failure before the family it belongs to, so a failed check is not shown as running", () => {
    expect(stateKind("checks.firmwareCheckFailed")).not.toBe("firmware");
    expect(stateKind("checks.genuineFailed")).not.toBe("genuine");
  });
});

describe("useDeviceOnboardingViewModel", () => {
  it("reports the status as a label before the machine runs", () => {
    const { result } = renderHook(() => useDeviceOnboardingViewModel(buildProps()));

    expect(result.current.statusLabel).toBe(statusCopy.idle);
    expect(result.current.deviceLabel).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("names the model and the transport in the device label, since the flow branches on both", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          device: { name: "Ledger Flex", modelId: "europa", sessionId: "session-1", wired: false },
        }),
      ),
    );

    expect(result.current.deviceLabel).toBe("Ledger Flex · europa · BLE · session-1");
  });

  it("lists every context field, a nested one by its path", () => {
    const context = {
      isOnboarded: true,
      lastDeviceState: { currentOnboardingStep: "pin", seedPhraseWordCount: 24 },
    };
    const { result } = renderHook(() => useDeviceOnboardingViewModel(buildProps({ context })));

    expect(result.current.contextRows).toEqual([
      { label: "isOnboarded", value: "true" },
      { label: "lastDeviceState.currentOnboardingStep", value: "pin" },
      { label: "lastDeviceState.seedPhraseWordCount", value: "24" },
    ]);
  });

  it("keeps a field the machine has not computed yet, which is a verdict that never ran", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ context: { verdictMatchesSession: null } })),
    );

    expect(result.current.contextRows).toEqual([{ label: "verdictMatchesSession", value: "null" }]);
  });

  it("stops a long context at 80 rows and says once that there is more", () => {
    // 20 nested levels, each with a field after it, around 100 values.
    let context: Record<string, unknown> = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [`field${index}`, index]),
    );
    for (let level = 0; level < 20; level++) context = { [`level${level}`]: context, after: level };

    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ context: context as DeviceOnboardingToolPayload })),
    );

    const more = result.current.contextRows.filter(row => row.value === logCopy.moreFields);
    expect(result.current.contextRows).toHaveLength(81);
    expect(more).toHaveLength(1);
  });

  it("lists every field on the opened event, including an error body and a url", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          state: "readingState",
          log: [
            {
              state: "readingState",
              event: {
                id: "read",
                type: "DEVICE_STATE_READ",
                at: 1,
                payload: {
                  firmwareVersion: "1.7.0",
                  state: {
                    seedWordIndex: 2,
                    seedPhraseWordCount: 24,
                    currentOnboardingStep: "pin",
                  },
                  failure: "https://secret.example/body",
                  note: "see https://secret.example/note",
                },
              },
            },
          ],
        }),
      ),
    );

    const event = result.current.logLines.find(line => line.line === "event");
    expect(event?.line === "event" ? event.payload : []).toEqual([
      { label: "firmwareVersion", value: "1.7.0" },
      { label: "state.seedWordIndex", value: "2" },
      { label: "state.seedPhraseWordCount", value: "24" },
      { label: "state.currentOnboardingStep", value: "pin" },
      { label: "failure", value: "https://secret.example/body" },
      { label: "note", value: "see https://secret.example/note" },
    ]);
  });

  it("puts each event under the state it led to, newest first", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          state: "routing",
          log: [
            { state: "readingState", event: { id: "ready", type: "SESSION_READY", at: 1 } },
            { state: "readingState", event: { id: "locked", type: "LOCKED", at: 1 } },
            { state: "routing", event: { id: "go", type: "CONTINUE", at: 2 } },
          ],
        }),
      ),
    );

    expect(
      result.current.logLines.map(line => (line.line === "state" ? line.label : line.type)),
    ).toEqual(["routing", "CONTINUE", "readingState", "LOCKED", "SESSION_READY"]);
  });

  it("keeps the most recent entries and leaves the host's log untouched", () => {
    const log = Object.freeze(buildLog(60));
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ state: "readingState", log })),
    );

    expect(eventIds(result.current.logLines)).toHaveLength(40);
    expect(eventIds(result.current.logLines)[0]).toBe("event-59");
    expect(log[0].event.id).toBe("event-0");
  });

  it("prints each kind of detail, and truncates one the host allowed to grow", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          state: "readingState",
          log: [
            {
              state: "readingState",
              event: { id: "none", type: "CONTINUE", at: 0 },
            },
            {
              state: "readingState",
              event: {
                id: "step",
                type: "STEP_CHANGED",
                at: 1,
                detail: { kind: "step", step: "pin" },
              },
            },
            {
              state: "readingState",
              event: {
                id: "firmware",
                type: "DEVICE_STATE_READ",
                at: 2,
                detail: { kind: "firmware", version: "2.4.0" },
              },
            },
            {
              state: "readingState",
              event: {
                id: "long",
                type: "SESSION_READY",
                at: 3,
                detail: { kind: "session", sessionId: "x".repeat(200) },
              },
            },
          ],
        }),
      ),
    );

    expect(
      result.current.logLines.flatMap(line => (line.line === "event" ? [line.detail] : [])),
    ).toEqual(["x".repeat(80), "2.4.0", "pin", null]);
  });

  it("labels every offered event, so one type offered twice stays readable", () => {
    const refused = { type: "GENUINE_CHECK_REFUSED", output: new Error("user said no") } as const;
    const lost = { type: "GENUINE_CHECK_REFUSED", output: new Error("channel lost") } as const;
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          sendableEvents: [
            { event: refused, label: "REFUSED · user" },
            { event: lost, label: "REFUSED · channel" },
            { event: { type: "CONTINUE" } },
          ],
        }),
      ),
    );

    expect(result.current.sendableRows.map(row => row.label)).toEqual([
      "REFUSED · user",
      "REFUSED · channel",
      "CONTINUE",
    ]);
    expect(result.current.sendableRows[0].event).toBe(refused);
    expect(new Set(result.current.sendableRows.map(row => row.key)).size).toBe(3);
  });

  it("keys the offered events apart even when the host reuses one label", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          sendableEvents: [
            { event: { type: "CONTINUE" }, label: "Continue" },
            { event: { type: "CONTINUE" }, label: "Continue" },
            { event: { type: "CONTINUE" }, label: "CONTINUE-2" },
            { event: { type: "CONTINUE" } },
          ],
        }),
      ),
    );

    expect(new Set(result.current.sendableRows.map(row => row.key)).size).toBe(4);
  });

  it("spells out the exit contract on the quit line, without the device id", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          state: "exitOnboarding",
          log: [{ state: "exitOnboarding", event: { id: "quit", type: "QUIT", at: 1 } }],
          exit: { reason: "userQuit", sessionId: "session-2", modelId: "stax" },
        }),
      ),
    );

    expect(quitPayload(result.current.logLines)).toEqual([
      { label: "sessionId", value: "session-2" },
      { label: "modelId", value: "stax" },
    ]);
  });

  it("marks an exit field the host left empty instead of rendering a blank row", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          state: "exitOnboarding",
          log: [{ state: "exitOnboarding", event: { id: "quit", type: "QUIT", at: 1 } }],
          exit: { reason: "userQuit", sessionId: "", modelId: "stax" },
        }),
      ),
    );

    expect(quitPayload(result.current.logLines)[0]).toEqual({ label: "sessionId", value: "—" });
  });

  const connected = { name: "Ledger Flex", modelId: "europa", sessionId: "s", wired: false };

  it.each([
    ["idle", null, connected, { canConnect: true, canSend: false, canReset: false }],
    ["connecting", null, null, { canConnect: false, canSend: false, canReset: true }],
    ["connecting", "Bluetooth is off", null, { canConnect: true, canSend: false, canReset: true }],
    ["running", null, connected, { canConnect: false, canSend: true, canReset: true }],
    ["running", "Transport lost", connected, { canConnect: false, canSend: true, canReset: true }],
    ["exited", null, connected, { canConnect: true, canSend: false, canReset: true }],
  ] as const)("allows %s with error %p to %p", (status, error, device, expected) => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ status, error, device })),
    );

    expect({
      canConnect: result.current.canConnect,
      canSend: result.current.canSend,
      canReset: result.current.canReset,
    }).toEqual(expected);
    expect(result.current.isRunning).toBe(status === "running");
  });

  it("sends the picked genuine result when that check is current", () => {
    const send = jest.fn();
    const { result, rerender } = renderHook(
      (state: string) => useDeviceOnboardingViewModel(buildProps({ state, send })),
      { initialProps: "readingState" },
    );

    act(() => pickOverride(result, "genuine", GenuineOverride.Genuine));
    expect(send).not.toHaveBeenCalled();

    rerender("checks.genuineCheck.running");
    expect(send).toHaveBeenCalledWith({
      type: "GENUINE_CHECK_PASSED",
      output: { isGenuine: true },
    });
  });

  it("sends the firmware result only while the firmware check is current", () => {
    const send = jest.fn();
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ state: "checks.firmwareCheck", send })),
    );

    act(() => pickOverride(result, "firmware", FirmwareOverride.UpToDate));
    expect(send).toHaveBeenCalledWith({
      type: "FIRMWARE_UP_TO_DATE",
      output: expect.objectContaining({
        firmwareVersion: { os: "override", mcu: "override", bootloader: "override" },
      }),
    });

    act(() => pickOverride(result, "firmware", FirmwareOverride.Outdated));
    expect(send).toHaveBeenLastCalledWith({
      type: "FIRMWARE_UPDATE_AVAILABLE",
      output: expect.objectContaining({
        update: expect.objectContaining({
          finalFirmware: expect.objectContaining({ version: "override" }),
        }),
      }),
    });
  });

  it("offers a new session once the transport went away mid-run", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ status: "running", device: null })),
    );

    expect(result.current.canConnect).toBe(true);
    expect(result.current.canSend).toBe(false);
  });
});

function pickOverride(
  result: { current: ReturnType<typeof useDeviceOnboardingViewModel> },
  key: string,
  value: string,
) {
  result.current.overrideRows.find(row => row.key === key)?.onChange(value);
}
