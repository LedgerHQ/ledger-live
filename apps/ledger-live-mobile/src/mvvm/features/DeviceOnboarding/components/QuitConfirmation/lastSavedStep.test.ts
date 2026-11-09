import { OnboardingStep } from "@features/platform-device-onboarding";
import type { TFunction } from "i18next";
import { lastSavedStepName } from "./lastSavedStep";

const t = ((key: string) => key) as unknown as TFunction;

describe("lastSavedStepName", () => {
  it("should name the introduction before a setup step is saved", () => {
    expect(lastSavedStepName("awaitingStart", null, t)).toBe(
      "deviceOnboarding.quitConfirmation.steps.intro",
    );
  });

  it("should name the genuine check while checks are in progress", () => {
    expect(lastSavedStepName("checks.checksIdle", null, t)).toBe(
      "deviceOnboarding.quitConfirmation.steps.checks",
    );
  });

  it("should name the setup step once one is saved", () => {
    expect(lastSavedStepName("checks.checksIdle", OnboardingStep.Pin, t)).toBe(
      "deviceOnboarding.quitConfirmation.steps.pin",
    );
    expect(lastSavedStepName(null, OnboardingStep.RestoreSeed, t)).toBe(
      "deviceOnboarding.quitConfirmation.steps.restore",
    );
  });
});
