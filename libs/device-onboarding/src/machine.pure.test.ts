import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { getNextSnapshot } from "xstate";
import { initialContext } from "./context";
import { deviceOnboardingMachine } from "./machine";
import type { DeviceOnboardingContext, OnboardingEvent } from "./types";

// These tests run one transition on a rebuilt state: no actor starts and no device answers.
// They hold because transitions only read the context and the event.

describe("pure transitions", () => {
  it("moves to the session the app reports, and stops trusting the old verdict", () => {
    const next = step(
      "awaitingSession",
      { type: "SESSION_READY", sessionId: "session-2" },
      {
        genuineVerdict: { sessionId: "session-1", isGenuine: true },
      },
    );

    expect(next.value).toBe("readingState");
    expect(next.context.sessionId).toBe("session-2");
    expect(next.context.genuineVerdict).toEqual({ sessionId: "session-1", isGenuine: true });
  });

  it("keeps the verdict across the reboot of an update the app ran", () => {
    const next = step(
      { checks: "firmwareUpdateDelegated" },
      { type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: "session-2" },
      {
        genuineVerdict: { sessionId: "session-1", isGenuine: true },
        firmwareChecked: true,
      },
    );

    expect(next.value).toBe("readingState");
    expect(next.context.sessionId).toBe("session-2");
    expect(next.context.genuineVerdict).toEqual({ sessionId: "session-2", isGenuine: true });
    expect(next.context.firmwareChecked).toBe(false);
  });

  it("exits with the session it holds", () => {
    const next = step("awaitingStart", { type: "QUIT" });

    expect(next.status).toBe("done");
    expect(next.output).toEqual({
      sessionId: "session-1",
      device: { id: "device", modelId: DeviceModelId.FLEX },
      reason: "userQuit",
    });
  });

  // The snapshots differ only in the refs of the actors they invoke.
  it("gives the same state for the same state and event", () => {
    const event: OnboardingEvent = { type: "SESSION_READY", sessionId: "session-2" };

    const first = step("awaitingSession", event);
    const second = step("awaitingSession", event);

    expect(second.value).toEqual(first.value);
    expect(second.context).toEqual(first.context);
  });
});

function step(
  value: string | Record<string, string>,
  event: OnboardingEvent,
  context: Partial<DeviceOnboardingContext> = {},
) {
  const snapshot = deviceOnboardingMachine.resolveState({
    value,
    context: {
      ...initialContext({
        dmk: {} as DeviceManagementKit,
        sessionId: "session-1",
        deviceId: "device",
        deviceModelId: DeviceModelId.FLEX,
        offerSync: false,
      }),
      ...context,
    },
  });

  return getNextSnapshot(deviceOnboardingMachine, snapshot, event);
}
