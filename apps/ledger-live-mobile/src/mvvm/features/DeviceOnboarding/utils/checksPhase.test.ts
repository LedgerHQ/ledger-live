import {
  asChecksState,
  isFirmwareUpdateDelegated,
  isPostSetupFirmware,
  toChecksError,
  toChecksScreenState,
  toFirmwareUpdate,
  toGenuineError,
} from "./checksPhase";

describe("toChecksScreenState", () => {
  it("should hide the checks screen before the checks phase", () => {
    expect(toChecksScreenState("readingState", false)).toBeNull();
    expect(toChecksScreenState("awaitingSessionAfterFirmwareUpdate", false)).toBeNull();
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
    expect(toChecksScreenState("checks.firmwareUpdateDelegated", false)).toBe("checking");
    expect(toChecksScreenState("checks.checksDone", false)).toBe("succeeded");
    expect(toChecksScreenState("checks.leavingEarlyCheckScreen", false)).toBe("succeeded");
    expect(toChecksScreenState("checks.checksSucceeded", false)).toBe("succeeded");
    expect(toChecksScreenState("checks.checksIdle", true)).toBe("idle");
    expect(toChecksScreenState("checks.checksIdle", false)).toBe("checking");
  });

  it("should keep the success screen while a seeded device leaves for sync", () => {
    expect(toChecksScreenState("syncOffer", false, true)).toBe("succeeded");
    expect(toChecksScreenState("done", false, true)).toBe("succeeded");
  });

  it("should keep the success screen when an unseeded device finishes setup", () => {
    expect(toChecksScreenState("done", false, false)).toBe("succeeded");
  });

  it("should hide the success screen when an unseeded device leaves for sync", () => {
    expect(toChecksScreenState("syncOffer", false, false)).toBeNull();
    expect(toChecksScreenState("done", false)).toBeNull();
  });

  it("should hide the success screen when a seeded device leaves another way", () => {
    expect(toChecksScreenState("exitOnboarding", false, true)).toBeNull();
    expect(toChecksScreenState("legacyFallback", false, true)).toBeNull();
    expect(toChecksScreenState("bootloaderRecovery", false, true)).toBeNull();
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

describe("toChecksError", () => {
  it("should report a stopped genuine check", () => {
    expect(toChecksError("checks.genuineFailed", "SECURE_CHANNEL_LOST")).toEqual({
      kind: "network",
    });
    expect(toChecksError("checks.notGenuineSupport", "DEVICE_NOT_GENUINE")).toEqual({
      kind: "notGenuine",
    });
  });

  it("should report a failed firmware check as retryable", () => {
    expect(toChecksError("checks.firmwareCheckFailed", null)).toEqual({ kind: "unknown" });
  });

  it("should report a failed firmware check after setup as retryable", () => {
    expect(toChecksError("postSetupFirmware.firmwareCheckFailed", null)).toEqual({
      kind: "unknown",
    });
  });

  it("should drop a remembered failure once the checks moved on", () => {
    expect(toChecksError("checks.checksIdle", "GENUINE_CHECK_REFUSED")).toBeNull();
    expect(toChecksError("checks.genuineCheck.running", "GENUINE_CHECK_REFUSED")).toBeNull();
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

describe("the firmware update held back until setup", () => {
  it("should show each post-setup firmware state as its pre-setup one", () => {
    expect(asChecksState("postSetupFirmware.firmwareCheck")).toBe("checks.firmwareCheck");
    expect(asChecksState("checks.firmwareCheck")).toBe("checks.firmwareCheck");
    expect(asChecksState("deviceSetup.pin")).toBe("deviceSetup.pin");
    expect(asChecksState(null)).toBeNull();
  });

  it.each([
    ["postSetupFirmware.firmwareCheck", "checking"],
    ["postSetupFirmware.firmwareCheckFailed", "checking"],
    ["postSetupFirmware.firmwareUpdateOffered", "updating"],
    ["postSetupFirmware.firmwareUpdateDelegated", "checking"],
  ])("should show %s as %s", (machineState, expected) => {
    expect(toChecksScreenState(machineState, false, false)).toBe(expected);
  });

  it("should recognise the update handover before and after setup", () => {
    expect(isFirmwareUpdateDelegated("checks.firmwareUpdateDelegated")).toBe(true);
    expect(isFirmwareUpdateDelegated("postSetupFirmware.firmwareUpdateDelegated")).toBe(true);
    expect(isFirmwareUpdateDelegated("postSetupFirmware.firmwareUpdateOffered")).toBe(false);
  });

  it("should tell the post-setup firmware states apart", () => {
    expect(isPostSetupFirmware("postSetupFirmware.firmwareUpdateOffered")).toBe(true);
    expect(isPostSetupFirmware("checks.firmwareUpdateOffered")).toBe(false);
    expect(isPostSetupFirmware(null)).toBe(false);
  });
});
