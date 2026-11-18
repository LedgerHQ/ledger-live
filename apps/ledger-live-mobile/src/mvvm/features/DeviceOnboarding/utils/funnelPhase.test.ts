import { deviceOnboardingMachine } from "@features/platform-device-onboarding";
import { checksScreenForPhase, phaseOf } from "./funnelPhase";

type StateTree = Readonly<{
  states: Readonly<Record<string, StateTree>>;
}>;

function atomicStates(node: StateTree, prefix: readonly string[] = []): string[] {
  const keys = Object.keys(node.states);
  if (keys.length === 0) return prefix.length === 0 ? [] : [prefix.join(".")];
  return keys.flatMap(key => atomicStates(node.states[key], [...prefix, key]));
}

describe("phaseOf", () => {
  it("should classify every state the machine can be in", () => {
    const states = atomicStates(deviceOnboardingMachine.root);

    expect(states.length).toBeGreaterThan(0);
    for (const state of states) {
      expect(phaseOf(state, false)).not.toBeNull();
    }
  });

  it("should connect only before the machine has a state or while the device reconnects", () => {
    expect(phaseOf(null)).toBe("connecting");
    expect(phaseOf("awaitingSessionAfterFirmwareUpdate")).toBe("connecting");
    expect(phaseOf("readingState")).not.toBe("connecting");
  });

  it("should synchronize while the device state is being read", () => {
    expect(phaseOf("readingState")).toBe("synchronizing");
    expect(phaseOf("routing")).toBe("synchronizing");
  });

  it("should synchronize while the device is locked or being set up", () => {
    expect(phaseOf("deviceLocked")).toBe("synchronizing");
    expect(phaseOf("deviceSetup.pin")).toBe("synchronizing");
  });

  it("should keep a seeded sync exit on the checks screen", () => {
    expect(phaseOf("syncOffer", true)).toBe("checks");
    expect(phaseOf("done", true)).toBe("checks");
    expect(phaseOf("syncOffer", false)).toBe("synchronizing");
    expect(phaseOf("done")).toBe("synchronizing");
    expect(phaseOf("done", false)).toBe("checks");
  });

  it.each(["awaitingSessionAfterFirmwareUpdate", "readingState", "routing"])(
    "should resume the checks of a seeded device returning from an OS update in %s",
    state => {
      expect(phaseOf(state, true, true)).toBe("resumingChecks");
    },
  );

  it("should not resume the checks of a device that is not seeded", () => {
    expect(phaseOf("awaitingSessionAfterFirmwareUpdate", false, true)).toBe("connecting");
    expect(phaseOf("readingState", false, true)).toBe("synchronizing");
    expect(phaseOf("readingState", null, true)).toBe("synchronizing");
  });

  it("should not resume the checks outside the waiting states", () => {
    expect(phaseOf("deviceLocked", true, true)).toBe("synchronizing");
    expect(phaseOf("legacyFallback", true, true)).toBe("synchronizing");
    expect(phaseOf("checks.checksIdle", true, true)).toBe("checks");
  });

  it("should not claim to know a state the machine does not have", () => {
    expect(phaseOf("notAState")).toBeNull();
  });
});

describe("checksScreenForPhase", () => {
  it("should show synchronizing for every phase that is not a connection or the checks", () => {
    expect(checksScreenForPhase("synchronizing", "readingState", false, false)).toBe(
      "synchronizing",
    );
    expect(checksScreenForPhase(null, "notAState", false, false)).toBe("synchronizing");
  });

  it("should keep the checks screen for a checks phase", () => {
    expect(checksScreenForPhase("checks", "checks.checksSucceeded", false, true)).toBe("succeeded");
    expect(checksScreenForPhase("checks", "syncOffer", false, true)).toBe("succeeded");
    expect(checksScreenForPhase("checks", "done", false, false)).toBe("succeeded");
  });

  it("should keep checking while the checks resume", () => {
    expect(checksScreenForPhase("resumingChecks", "readingState", false, true)).toBe("checking");
  });

  it("should show no checks screen while connecting or failed", () => {
    expect(checksScreenForPhase("connecting", null, false, false)).toBeNull();
    expect(checksScreenForPhase("failed", "awaitingSession", false, false)).toBeNull();
  });
});
