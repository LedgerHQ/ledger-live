import { getOnboardingStatusAttributes } from "./onboardingStatus";

describe("getOnboardingStatusAttributes", () => {
  it("returns onboarding status and seedConfiguration during onboarding flow", () => {
    const result = getOnboardingStatusAttributes(
      false,
      true,
      { seedConfiguration: "new_seed" },
      true,
      true,
    );

    expect(result).toEqual({
      onboarding_status: "Onboarding",
      seedConfiguration: "new_seed",
    });
  });

  it("returns onboarding status without seedConfiguration when onboardingSyncFlow is null", () => {
    const result = getOnboardingStatusAttributes(false, true, null, true, true);

    expect(result).toEqual({
      onboarding_status: "Onboarding",
    });
  });

  it("returns post-onboarding status when post-onboarding is in progress", () => {
    const result = getOnboardingStatusAttributes(true, false, null, true, true);

    expect(result).toEqual({
      onboarding_status: "post-onboarding",
    });
  });

  it("returns lazy_onboarding when read only and onboarding is completed", () => {
    const result = getOnboardingStatusAttributes(false, false, null, true, true);

    expect(result).toEqual({
      onboarding_status: "lazy_onboarding",
    });
  });

  it("returns empty object when no onboarding context applies", () => {
    const result = getOnboardingStatusAttributes(false, false, null, true, false);

    expect(result).toEqual({});
  });
});
