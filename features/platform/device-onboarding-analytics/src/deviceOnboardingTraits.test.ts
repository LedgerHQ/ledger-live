import type { Features } from "@shared/feature-flags";
import { deviceOnboardingTraits } from "./deviceOnboardingTraits";

const allOn = {
  offerLedgerSync: true,
  connectSeededDevice: true,
  connectUnseededDevice: true,
  unifiedEntryPoints: true,
  recover: true,
};

const allOff = {
  connectSeededDevice: false,
  connectUnseededDevice: false,
  offerLedgerSync: false,
  unifiedEntryPoints: false,
  recover: false,
};

describe("deviceOnboardingTraits", () => {
  it("should send every param when the flag is on", () => {
    expect(deviceOnboardingTraits({ enabled: true, params: allOn })).toEqual(allOn);
  });

  it("should send each param as it is", () => {
    const flag = {
      enabled: true,
      params: { ...allOn, connectUnseededDevice: false, unifiedEntryPoints: false },
    };

    expect(deviceOnboardingTraits(flag)).toEqual({
      connectSeededDevice: true,
      connectUnseededDevice: false,
      offerLedgerSync: true,
      unifiedEntryPoints: false,
      recover: true,
    });
  });

  it("should send recover as false when the flag hides Recover", () => {
    const flag = { enabled: true, params: { ...allOn, recover: false } };

    expect(deviceOnboardingTraits(flag).recover).toBe(false);
  });

  it("should send recover as true when a saved value predates the param", () => {
    const flag = {
      enabled: true,
      params: { offerLedgerSync: true },
    } as Features["deviceOnboarding"];

    expect(deviceOnboardingTraits(flag).recover).toBe(true);
  });

  it.each([
    ["the flag is off", { enabled: false, params: allOn }],
    ["the flag is not loaded", null],
  ])("should send false for every param when %s", (_case, flag) => {
    expect(deviceOnboardingTraits(flag)).toEqual(allOff);
  });

  it("should send every param but recover as false when a saved value has no params", () => {
    const flag = { enabled: true } as Features["deviceOnboarding"];

    expect(deviceOnboardingTraits(flag)).toEqual({ ...allOff, recover: true });
  });
});
