import type { Features } from "@shared/feature-flags";
import { deviceOnboardingTraits } from "./deviceOnboardingTraits";

const allOn = {
  offerLedgerSync: true,
  connectSeededDevice: true,
  connectUnseededDevice: true,
  unifiedEntryPoints: true,
};

const allOff = {
  connectSeededDevice: false,
  connectUnseededDevice: false,
  offerLedgerSync: false,
  unifiedEntryPoints: false,
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
    });
  });

  it.each([
    ["the flag is off", { enabled: false, params: allOn }],
    ["the flag is not loaded", null],
    ["a saved value has no params", { enabled: true } as Features["deviceOnboarding"]],
  ])("should send false for every param when %s", (_case, flag) => {
    expect(deviceOnboardingTraits(flag)).toEqual(allOff);
  });
});
