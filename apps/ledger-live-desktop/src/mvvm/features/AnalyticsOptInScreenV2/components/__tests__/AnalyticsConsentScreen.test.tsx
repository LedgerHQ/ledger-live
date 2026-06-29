import React from "react";
import { render, screen } from "tests/testSetup";
import { AnalyticsConsentScreen } from "../AnalyticsConsentScreen";

const baseProps = {
  shouldWeTrack: false,
  onAcceptAll: jest.fn(),
  onRefuseAll: jest.fn(),
  onPrevious: jest.fn(),
  onOpenPreferences: jest.fn(),
  onOpenTrackingPolicy: jest.fn(),
};

describe("AnalyticsConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render main copy and actions", () => {
    render(<AnalyticsConsentScreen {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Help us improve Ledger" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Accept all" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Refuse all" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Set preferences" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Learn more about our Tracking Policy" }),
    ).toBeVisible();
  });

  it("should render the consent illustration", () => {
    const { container } = render(<AnalyticsConsentScreen {...baseProps} />);
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "analyticsConsentIllustrationDark",
    );
  });

  it("should call action handlers when buttons are pressed", async () => {
    const { user } = render(<AnalyticsConsentScreen {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Accept all" }));
    await user.click(screen.getByRole("button", { name: "Refuse all" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Set preferences" }));
    await user.click(screen.getByRole("link", { name: "Learn more about our Tracking Policy" }));

    expect(baseProps.onAcceptAll).toHaveBeenCalledTimes(1);
    expect(baseProps.onRefuseAll).toHaveBeenCalledTimes(1);
    expect(baseProps.onPrevious).toHaveBeenCalledTimes(1);
    expect(baseProps.onOpenPreferences).toHaveBeenCalledTimes(1);
    expect(baseProps.onOpenTrackingPolicy).toHaveBeenCalledTimes(1);
  });
});
