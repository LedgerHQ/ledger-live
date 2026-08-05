import { LEGACY_ONBOARDING_DATE, resolveOnboardingDateForUpsell } from "./legacyOnboardingDate";

describe("legacyOnboardingDate", () => {
  it("should expose a fixed legacy onboarding date", () => {
    expect(LEGACY_ONBOARDING_DATE.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("should resolve null to the legacy onboarding date", () => {
    expect(resolveOnboardingDateForUpsell(null).toISOString()).toBe(
      LEGACY_ONBOARDING_DATE.toISOString(),
    );
  });

  it("should resolve an invalid date to the legacy onboarding date", () => {
    expect(resolveOnboardingDateForUpsell(new Date("invalid")).toISOString()).toBe(
      LEGACY_ONBOARDING_DATE.toISOString(),
    );
  });

  it("should preserve a known onboarding date", () => {
    const onboardingDate = new Date("2024-03-04T05:06:07.000Z");

    expect(resolveOnboardingDateForUpsell(onboardingDate)).toBe(onboardingDate);
  });

  it("should return a fresh date instance for the legacy fallback", () => {
    const resolved = resolveOnboardingDateForUpsell(null);

    expect(resolved).not.toBe(LEGACY_ONBOARDING_DATE);
    expect(resolved.toISOString()).toBe(LEGACY_ONBOARDING_DATE.toISOString());
  });
});
