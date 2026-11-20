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
    expect(deviceOnboardingTraits({ enabled: true, params: allOn })).toEqual({
      deviceOnboarding: true,
      ...allOn,
    });
  });

  it("should send each param as it is", () => {
    const flag = {
      enabled: true,
      params: { ...allOn, connectUnseededDevice: false, unifiedEntryPoints: false },
    };

    expect(deviceOnboardingTraits(flag)).toEqual({
      deviceOnboarding: true,
      connectSeededDevice: true,
      connectUnseededDevice: false,
      offerLedgerSync: true,
      unifiedEntryPoints: false,
    });
  });

  it.each([
    ["the flag is off", { enabled: false, params: allOn }],
    ["the flag is not loaded", null],
  ])("should send false for every trait when %s", (_case, flag) => {
    expect(deviceOnboardingTraits(flag)).toEqual({ deviceOnboarding: false, ...allOff });
  });

  it("should send the flag as on when a saved value has no params", () => {
    expect(deviceOnboardingTraits({ enabled: true } as Features["deviceOnboarding"])).toEqual({
      deviceOnboarding: true,
      ...allOff,
    });
  });
});
