import { canRetryWithoutUser, isDeviceOffDuringChecks } from "./deviceOff";

describe("isDeviceOffDuringChecks", () => {
  const holding = {
    machineState: "awaitingSession",
    heldMachineState: "checks.genuineCheck.running",
    onboardedOnEntry: true,
    hasLiveDevice: true,
    returningFromFirmwareUpdate: false,
  };

  it("should hold the checks while the session is awaited", () => {
    expect(isDeviceOffDuringChecks(holding)).toBe(true);
  });

  it("should hold the checks while it is not known yet whether the device was onboarded", () => {
    expect(isDeviceOffDuringChecks({ ...holding, onboardedOnEntry: null })).toBe(true);
  });

  it.each(["readingState", "routing"])(
    "should hold the checks when the device switches off in %s while returning from an OS update",
    heldMachineState => {
      expect(
        isDeviceOffDuringChecks({
          ...holding,
          heldMachineState,
          returningFromFirmwareUpdate: true,
        }),
      ).toBe(true);
    },
  );

  it.each([
    ["the device is not returning from an OS update", { returningFromFirmwareUpdate: false }],
    [
      "the device is not known to be onboarded",
      { returningFromFirmwareUpdate: true, onboardedOnEntry: null },
    ],
  ])("should not hold the reading of the device when %s", (_, change) => {
    expect(
      isDeviceOffDuringChecks({ ...holding, heldMachineState: "readingState", ...change }),
    ).toBe(false);
  });

  it.each([
    ["the machine is not awaiting a session", { machineState: "checks.genuineCheck.running" }],
    ["the held screen is not a check", { heldMachineState: "deviceSetup.intro" }],
    ["nothing is held", { heldMachineState: null }],
    ["the device is being set up", { onboardedOnEntry: false }],
    ["there is no device to wait for", { hasLiveDevice: false }],
  ])("should not hold when %s", (_, change) => {
    expect(isDeviceOffDuringChecks({ ...holding, ...change })).toBe(false);
  });
});

describe("canRetryWithoutUser", () => {
  it.each(["Unable to connect to the device", "unknown-error", "unknown"])(
    "should retry %s silently",
    error => {
      expect(canRetryWithoutUser(error)).toBe(true);
    },
  );

  it.each(["bluetooth-disabled-promptable", "ble-pairing-refused"])(
    "should wait for the user on %s",
    error => {
      expect(canRetryWithoutUser(error)).toBe(false);
    },
  );
});
