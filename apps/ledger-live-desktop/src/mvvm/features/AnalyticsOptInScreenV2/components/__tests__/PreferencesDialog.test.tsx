import React from "react";
import { render, screen } from "tests/testSetup";
import { PreferencesDialog } from "../PreferencesDialog";

const baseProps = {
  isOpen: true,
  onBackFromPreferences: jest.fn(),
  onClosed: jest.fn(),
  draftShareAnalytics: false,
  draftSharePersonalized: false,
  setDraftShareAnalytics: jest.fn(),
  setDraftSharePersonalized: jest.fn(),
  applyPreferences: jest.fn(),
  privacyPolicyUrl: "https://example.com/privacy",
  onOpenPrivacyPolicy: jest.fn(),
};

describe("PreferencesDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when closed", () => {
    render(<PreferencesDialog {...baseProps} isOpen={false} />);

    expect(screen.queryByTestId("analytics-opt-in-screen-preferences")).not.toBeInTheDocument();
  });

  it("should render preferences content when open", () => {
    render(<PreferencesDialog {...baseProps} />);

    expect(screen.getByTestId("analytics-opt-in-screen-preferences")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Set preferences" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeVisible();
  });

  it("should call applyPreferences when confirm is pressed", async () => {
    const { user } = render(<PreferencesDialog {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(baseProps.applyPreferences).toHaveBeenCalledTimes(1);
  });
});
