import React from "react";
import { render, screen } from "@tests/test-renderer";
import LargeScreenUpsellDebug from "../index";
import { useLargeScreenUpsellDebugViewModel } from "../useLargeScreenUpsellDebugViewModel";

jest.mock("../useLargeScreenUpsellDebugViewModel", () => ({
  useLargeScreenUpsellDebugViewModel: jest.fn(),
}));

const mockedViewModel = useLargeScreenUpsellDebugViewModel as jest.Mock;

function buildViewModel(overrides: Record<string, unknown> = {}) {
  return {
    wouldShow: false,
    isFlagEnabled: false,
    modalEnabled: true,
    killThreshold: 3,
    cadenceDays: 30,
    cooldownDaysDefault: 30,
    breakdown: {
      audienceOk: null,
      audienceHint: undefined,
      cooldownOk: null,
      cooldownHint: "Onboarding + 30 day(s).",
      notThrottledOk: null,
      throttleHint: "Kill threshold 3 within 30 day(s).",
    },
    onboardingDateValue: "",
    onboardingDateHint: "Now: null",
    retriesValue: "0",
    retriesHint: "Now: 0.",
    lastSeenValue: "",
    lastSeenHint: "Now: null",
    handleToggleFlag: jest.fn(),
    handleApplyOnboardingDate: jest.fn(),
    handleSetOnboardingDateNull: jest.fn(),
    handleApplyRetries: jest.fn(),
    handleResetRetries: jest.fn(),
    handleApplyLastSeen: jest.fn(),
    handleSetLastSeenNull: jest.fn(),
    ...overrides,
  };
}

describe("LargeScreenUpsellDebug", () => {
  it("shows the WON'T SHOW verdict and every section", () => {
    mockedViewModel.mockReturnValue(buildViewModel({ wouldShow: false }));

    render(<LargeScreenUpsellDebug />);

    expect(screen.getByText("Large-screen upsell debug")).toBeVisible();
    expect(screen.getByText("WON'T SHOW")).toBeVisible();
    expect(screen.getByText("Decision breakdown")).toBeVisible();
    expect(screen.getByText("Feature flag enabled")).toBeVisible();
    expect(screen.getByText("largeScreenUpsell")).toBeVisible();
    expect(screen.getByText("Onboarding date")).toBeVisible();
    expect(screen.getByText("Frequency state")).toBeVisible();
  });

  it("shows the WILL SHOW verdict when the decision passes", () => {
    mockedViewModel.mockReturnValue(
      buildViewModel({
        wouldShow: true,
        isFlagEnabled: true,
        breakdown: {
          audienceOk: true,
          audienceHint: undefined,
          cooldownOk: true,
          cooldownHint: "Onboarding + 30 day(s).",
          notThrottledOk: true,
          throttleHint: "Kill threshold 3 within 30 day(s).",
        },
      }),
    );

    render(<LargeScreenUpsellDebug />);

    expect(screen.getByText("WILL SHOW")).toBeVisible();
  });
});
