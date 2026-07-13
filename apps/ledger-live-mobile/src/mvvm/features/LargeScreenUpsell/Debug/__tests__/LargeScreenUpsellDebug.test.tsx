import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
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
    discountValue: "0.2",
    killThresholdValue: "3",
    cadenceDaysValue: "30",
    cooldownDaysDefaultValue: "30",
    resolvedCooldownDaysValue: "30",
    handleToggleModalEnabled: jest.fn(),
    handleApplyKillThreshold: jest.fn(() => undefined),
    handleApplyCadenceDays: jest.fn(() => undefined),
    handleApplyCooldownDays: jest.fn(() => undefined),
    handleApplyDiscount: jest.fn(() => undefined),
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
    isPreviewOpen: false,
    isPreviewOptedIn: false,
    previewVariantHint: "Opted-out copy (analytics off). Toggle on for the opted-in copy.",
    canPreview: true,
    previewViewModel: null,
    previewBottomInset: 20,
    handleOpenPreview: jest.fn(),
    handleClosePreview: jest.fn(),
    handleTogglePreviewVariant: jest.fn(),
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

  it("forces the modal preview open on demand", () => {
    const handleOpenPreview = jest.fn();
    mockedViewModel.mockReturnValue(buildViewModel({ handleOpenPreview }));

    render(<LargeScreenUpsellDebug />);

    expect(screen.getByText("Preview modal")).toBeVisible();
    fireEvent.press(screen.getByText("Show modal now"));

    expect(handleOpenPreview).toHaveBeenCalled();
  });

  it("toggles the previewed copy variant", () => {
    const handleTogglePreviewVariant = jest.fn();
    mockedViewModel.mockReturnValue(
      buildViewModel({ handleTogglePreviewVariant, isPreviewOptedIn: false }),
    );

    render(<LargeScreenUpsellDebug />);

    expect(screen.getByText("Opted-in copy variant")).toBeVisible();
    fireEvent(screen.getAllByRole("switch")[0], "onCheckedChange", true);

    expect(handleTogglePreviewVariant).toHaveBeenCalledWith(true);
  });

  it("edits a feature flag param", () => {
    const handleApplyKillThreshold = jest.fn(() => undefined);
    mockedViewModel.mockReturnValue(buildViewModel({ handleApplyKillThreshold }));

    render(<LargeScreenUpsellDebug />);

    expect(screen.getByText("modal.killThreshold")).toBeVisible();
    expect(screen.getByText("discount")).toBeVisible();
    fireEvent.press(screen.getAllByText("Apply")[0]);

    expect(handleApplyKillThreshold).toHaveBeenCalledWith("3");
  });
});
