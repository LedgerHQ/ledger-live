import { renderHook } from "@testing-library/react";
import { buildProps } from "jest/deviceOnboardingProps";
import type { DeviceOnboardingToolContext } from "../types";
import {
  formatTime,
  formatValue,
  stateKind,
  useDeviceOnboardingViewModel,
} from "./useDeviceOnboardingViewModel";

function buildEvents(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `event-${index}`,
    type: "CONTINUE" as const,
    at: index,
  }));
}

describe("formatValue", () => {
  it.each([
    [undefined, "—"],
    ["", "—"],
    ["welcome-screen-1", "welcome-screen-1"],
    [null, "null"],
    [false, "false"],
    [0, "0"],
  ])("formats %p as %p", (value, expected) => {
    expect(formatValue(value)).toBe(expected);
  });

  it.each([
    ["an error, whose message would carry a backend response", new Error("HTTP 500 https://x")],
    ["an object without a prototype, which cannot be stringified", Object.create(null)],
    [
      "an object whose stringification throws",
      {
        toString: () => {
          throw new Error("boom");
        },
      },
    ],
  ])("marks %s rather than printing or throwing", (_, value) => {
    expect(formatValue(value as unknown as string)).toBe("—");
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
  it("reports the status as a label and no step before the machine runs", () => {
    const { result } = renderHook(() => useDeviceOnboardingViewModel(buildProps()));

    expect(result.current.statusLabel).toBe("Not started");
    expect(result.current.stateSteps).toEqual([]);
    expect(result.current.deviceLabel).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it("keeps every state the machine went through, marking the last one as current", () => {
    const { result, rerender } = renderHook(
      (state: string | null) => useDeviceOnboardingViewModel(buildProps({ state })),
      { initialProps: "readingState" as string | null },
    );

    rerender("routing");
    rerender("checks.genuineCheck");

    expect(result.current.stateSteps).toEqual([
      { key: "0-readingState", label: "readingState", kind: "progress", isCurrent: false },
      { key: "1-routing", label: "routing", kind: "progress", isCurrent: false },
      {
        key: "2-checks.genuineCheck",
        label: "checks.genuineCheck",
        kind: "genuine",
        isCurrent: true,
      },
    ]);
  });

  it("appends a revisited state rather than collapsing it, so a loop stays visible", () => {
    const { result, rerender } = renderHook(
      (state: string | null) => useDeviceOnboardingViewModel(buildProps({ state })),
      { initialProps: "readingState" as string | null },
    );

    rerender("deviceLocked");
    rerender("readingState");
    rerender("readingState");

    expect(result.current.stateSteps.map(step => step.label)).toEqual([
      "readingState",
      "deviceLocked",
      "readingState",
    ]);
  });

  it("clears the trail once the host drops the state, so a reset starts from scratch", () => {
    const { result, rerender } = renderHook(
      (state: string | null) => useDeviceOnboardingViewModel(buildProps({ state })),
      { initialProps: "readingState" as string | null },
    );

    rerender("routing");
    rerender(null);

    expect(result.current.stateSteps).toEqual([]);
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

  it("prints only the fields it watches, whatever else the host hands over", () => {
    const context = {
      isOnboarded: true,
      seedWordIndex: 17,
      seedPhraseWordCount: 24,
      deviceId: "ble|1",
    } as DeviceOnboardingToolContext;
    const { result } = renderHook(() => useDeviceOnboardingViewModel(buildProps({ context })));

    expect(result.current.contextRows).toEqual([{ label: "isOnboarded", value: "true" }]);
  });

  it("keeps a field the machine has not computed yet, which is a verdict that never ran", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ context: { verdictMatchesSession: null } })),
    );

    expect(result.current.contextRows).toEqual([{ label: "verdictMatchesSession", value: "null" }]);
  });

  it("orders the context rows for reading, not as the host built them", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          context: { checksPaused: false, isOnboarded: true, deviceModelId: "europa" },
        }),
      ),
    );

    expect(result.current.contextRows.map(row => row.label)).toEqual([
      "deviceModelId",
      "isOnboarded",
      "checksPaused",
    ]);
  });

  it("shows the newest event first, whatever order the host appended", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          events: [
            { id: "oldest", type: "SESSION_READY", at: 5 },
            { id: "newest", type: "LOCKED", at: 9 },
            { id: "middle", type: "UNLOCKED", at: 7 },
          ],
        }),
      ),
    );

    expect(result.current.eventRows.map(row => row.id)).toEqual(["newest", "middle", "oldest"]);
  });

  it("falls back on the append order when several transitions share a millisecond", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          events: [
            { id: "first", type: "SESSION_READY", at: 3 },
            { id: "second", type: "UNLOCKED", at: 3 },
            { id: "third", type: "STEP_CHANGED", at: 3 },
          ],
        }),
      ),
    );

    expect(result.current.eventRows.map(row => row.id)).toEqual(["third", "second", "first"]);
  });

  it("keeps the most recent entries and leaves the host's log untouched", () => {
    const events = Object.freeze(buildEvents(60));
    const { result } = renderHook(() => useDeviceOnboardingViewModel(buildProps({ events })));

    expect(result.current.eventRows).toHaveLength(40);
    expect(result.current.eventRows[0].id).toBe("event-59");
    expect(events[0].id).toBe("event-0");
  });

  it("prints each kind of detail, and truncates one the host allowed to grow", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          events: [
            {
              id: "long",
              type: "SESSION_READY",
              at: 3,
              detail: { kind: "session", sessionId: "x".repeat(200) },
            },
            {
              id: "firmware",
              type: "DEVICE_STATE_READ",
              at: 2,
              detail: { kind: "firmware", version: "2.4.0" },
            },
            { id: "step", type: "STEP_CHANGED", at: 1, detail: { kind: "step", step: "pin" } },
            { id: "none", type: "CONTINUE", at: 0 },
          ],
        }),
      ),
    );

    expect(result.current.eventRows.map(row => row.detail)).toEqual([
      "x".repeat(80),
      "2.4.0",
      "pin",
      null,
    ]);
  });

  it("labels every offered event, so one type offered twice stays readable", () => {
    const refused = { type: "GENUINE_CHECK_REFUSED", failure: new Error("user said no") } as const;
    const lost = { type: "GENUINE_CHECK_REFUSED", failure: new Error("channel lost") } as const;
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

  it("spells out the exit contract, without the device id", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          exit: { reason: "offerLedgerSync", sessionId: "session-2", modelId: "stax" },
        }),
      ),
    );

    expect(result.current.exitRows).toEqual([
      { label: "reason", value: "offerLedgerSync" },
      { label: "sessionId", value: "session-2" },
      { label: "modelId", value: "stax" },
    ]);
  });

  it("marks an exit field the host left empty instead of rendering a blank row", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({ exit: { reason: "userQuit", sessionId: "", modelId: "stax" } }),
      ),
    );

    expect(result.current.exitRows[1]).toEqual({ label: "sessionId", value: "—" });
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

  it("offers a new session once the transport went away mid-run", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ status: "running", device: null })),
    );

    expect(result.current.canConnect).toBe(true);
    expect(result.current.canSend).toBe(false);
  });
});
