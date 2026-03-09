/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { SecurityScoreWidget } from ".";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockOpenURL = jest.mocked(openURL);

const renderWidget = (enabled: boolean) =>
  render(<SecurityScoreWidget />, {
    initialState: {
      settings: {
        ...INITIAL_STATE,
        overriddenFeatureFlags: {
          ...INITIAL_STATE.overriddenFeatureFlags,
          feature_hackathon_engagement_h1_security_score: {
            enabled,
          },
        },
      },
    },
  });

describe("SecurityScoreWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("should not render when the feature flag is disabled", () => {
    renderWidget(false);

    expect(screen.queryByTestId("portfolio-security-score-widget")).toBeNull();
  });

  it("should render when the feature flag is enabled", () => {
    renderWidget(true);

    expect(screen.getByTestId("portfolio-security-score-widget")).toBeVisible();
    expect(screen.getByText("75")).toBeVisible();
    expect(screen.getByText("Token approvals review recommended")).toBeVisible();
  });

  it("should open revoke cash and update the score after a security check-in", async () => {
    const { user } = renderWidget(true);

    await user.click(screen.getByTestId("portfolio-security-score-cta"));

    expect(mockOpenURL).toHaveBeenCalledWith("ledgerlive://discover/revoke-cash");
    expect(screen.getByText("100")).toBeVisible();
    expect(screen.getByText("Token approvals checked today")).toBeVisible();
    expect(
      screen.getByText("Vault health improved. Token approvals are in a healthier state."),
    ).toBeVisible();
  });

  it("should reset the widget after five clicks on the reset area", async () => {
    const { user } = renderWidget(true);

    await user.click(screen.getByTestId("portfolio-security-score-cta"));

    const resetArea = screen.getByTestId("portfolio-security-score-reset-area");
    for (let i = 0; i < 5; i += 1) {
      await user.click(resetArea);
    }

    expect(screen.getByText("75")).toBeVisible();
    expect(screen.getByText("Token approvals review recommended")).toBeVisible();
    expect(
      screen.queryByText("Vault health improved. Token approvals are in a healthier state."),
    ).toBeNull();
  });
});
