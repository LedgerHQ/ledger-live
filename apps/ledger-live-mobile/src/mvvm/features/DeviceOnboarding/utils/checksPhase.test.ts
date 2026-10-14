import { toChecksScreenState, toFirmwareUpdate, toGenuineError } from "./checksPhase";

describe("toChecksScreenState", () => {
  it("should hide the checks screen before the checks phase", () => {
    expect(toChecksScreenState("readingState", false)).toBeNull();
    expect(toChecksScreenState("legacyFallback", false)).toBeNull();
    expect(toChecksScreenState(null, false)).toBeNull();
  });

  it("should wait for the user to start", () => {
    expect(toChecksScreenState("awaitingStart", false)).toBe("idle");
  });

  it("should map each checks state the screen can show", () => {
    expect(toChecksScreenState("checks.genuineCheck.awaitingApproval", false)).toBe(
      "awaitingAllow",
    );
    expect(toChecksScreenState("checks.genuineCheck.running", false)).toBe("checking");
    expect(toChecksScreenState("checks.firmwareCheck", false)).toBe("checking");
    expect(toChecksScreenState("checks.firmwareUpdateOffered", false)).toBe("updating");
    expect(toChecksScreenState("checks.checksSucceeded", false)).toBe("succeeded");
    expect(toChecksScreenState("checks.checksIdle", true)).toBe("idle");
    expect(toChecksScreenState("checks.checksIdle", false)).toBe("checking");
  });
});

describe("toGenuineError", () => {
  it("should map a refused check to the declined sheet", () => {
    expect(toGenuineError("GENUINE_CHECK_REFUSED")).toEqual({ kind: "declined" });
  });

  it("should ignore a failure kind the screen does not show", () => {
    expect(toGenuineError(null)).toBeNull();
    expect(toGenuineError("OTHER")).toBeNull();
  });
});

describe("toFirmwareUpdate", () => {
  it("should hide the update until a version is available", () => {
    expect(toFirmwareUpdate("1.0.0", null)).toBeNull();
  });

  it("should keep the current version next to the available one", () => {
    expect(toFirmwareUpdate("1.0.0", "1.1.0")).toEqual({ current: "1.0.0", available: "1.1.0" });
  });
});
