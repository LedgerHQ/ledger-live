import { shouldRevealFunnel } from "./pairingHold";

describe("shouldRevealFunnel", () => {
  it.each([null, "readingState", "routing"])(
    "should keep the pairing success up while the machine is in %s",
    state => {
      expect(shouldRevealFunnel(state, null)).toBe(false);
    },
  );

  it.each([
    "awaitingStart",
    "checks.checksIdle",
    "deviceSetup.waiting",
    "deviceLocked",
    "awaitingSession",
  ])("should open the funnel once the machine is in %s", state => {
    expect(shouldRevealFunnel(state, null)).toBe(true);
  });

  it.each(["legacyFallback", "bootloaderRecovery", "done", "syncOffer"])(
    "should leave %s to the machine exit instead of opening the funnel",
    state => {
      expect(shouldRevealFunnel(state, null)).toBe(false);
    },
  );

  it("should open the funnel when connecting the paired device fails", () => {
    expect(shouldRevealFunnel(null, "Unable to connect to the device")).toBe(true);
  });
});
