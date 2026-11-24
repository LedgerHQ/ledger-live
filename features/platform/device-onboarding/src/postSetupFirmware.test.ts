import {
  asChecksState,
  finishesSetupOnQuit,
  isFirmwareCheckFailed,
  isFirmwareUpdateDelegated,
  isHeldBackUpdatePending,
} from "./postSetupFirmware";
import type { DeviceOnboardingContext } from "./types";

describe("post-setup firmware states", () => {
  it("reads a post-setup state as the pre-setup checks state", () => {
    expect(asChecksState("postSetupFirmware.firmwareUpdateOffered")).toBe(
      "checks.firmwareUpdateOffered",
    );
    expect(asChecksState("checks.genuineFailed")).toBe("checks.genuineFailed");
    expect(asChecksState(null)).toBeNull();
  });

  it.each(["checks.firmwareCheckFailed", "postSetupFirmware.firmwareCheckFailed"])(
    "finds a failed firmware check in %s",
    state => {
      expect(isFirmwareCheckFailed(state)).toBe(true);
    },
  );

  it.each(["checks.firmwareUpdateDelegated", "postSetupFirmware.firmwareUpdateDelegated"])(
    "finds the update handed over in %s",
    state => {
      expect(isFirmwareUpdateDelegated(state)).toBe(true);
    },
  );

  it.each(["checks.genuineFailed", "postSetupFirmware.firmwareUpdateOffered", null])(
    "finds neither in %s",
    state => {
      expect(isFirmwareCheckFailed(state)).toBe(false);
      expect(isFirmwareUpdateDelegated(state)).toBe(false);
    },
  );
});

describe("held-back update", () => {
  const attested = {
    sessionId: "session",
    genuineVerdict: { sessionId: "session", isGenuine: true },
  };

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])(
    "is pending with updateAfterSetup %s and isOnboarded %s: %s",
    (updateAfterSetup, isOnboarded, pending) => {
      expect(isHeldBackUpdatePending({ updateAfterSetup, isOnboarded, firmware: null })).toBe(
        pending,
      );
    },
  );

  it.each(["upToDate", "declined", "skipped"] as const)(
    "is no longer pending once the update is answered as %s",
    kind => {
      expect(
        isHeldBackUpdatePending({ updateAfterSetup: true, isOnboarded: true, firmware: { kind } }),
      ).toBe(false);
    },
  );

  it.each(["deferred", "offered"] as const)("is still pending while the update is %s", kind => {
    const firmware = { kind } as DeviceOnboardingContext["firmware"];
    expect(isHeldBackUpdatePending({ updateAfterSetup: true, isOnboarded: true, firmware })).toBe(
      true,
    );
  });

  it("still finishes the setup on quit once the update is answered", () => {
    expect(finishesSetupOnQuit({ updateAfterSetup: true, isOnboarded: true, ...attested })).toBe(
      true,
    );
  });

  it("finishes the setup on quit once this session is genuine", () => {
    expect(finishesSetupOnQuit({ updateAfterSetup: true, isOnboarded: true, ...attested })).toBe(
      true,
    );
  });

  it.each([
    [
      "not genuine",
      { sessionId: "session", genuineVerdict: { sessionId: "session", isGenuine: false } },
    ],
    [
      "attested on another session",
      { sessionId: "session-2", genuineVerdict: attested.genuineVerdict },
    ],
    ["not checked yet", { sessionId: "session", genuineVerdict: null }],
  ])("quits instead when the session is %s", (_, verdict) => {
    expect(finishesSetupOnQuit({ updateAfterSetup: true, isOnboarded: true, ...verdict })).toBe(
      false,
    );
  });

  it("quits instead while the device is still being set up", () => {
    expect(finishesSetupOnQuit({ updateAfterSetup: true, isOnboarded: false, ...attested })).toBe(
      false,
    );
  });
});
